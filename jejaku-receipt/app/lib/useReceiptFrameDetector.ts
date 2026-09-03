"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { createWorker, type Worker } from "tesseract.js";

// OpenCV.js has no first-party TypeScript definitions — it's a dynamically
// loaded external global (its whole API is bound at runtime from WASM), so
// `any` here is the honest type, not a shortcut.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Cv = any;

declare global {
  interface Window {
    cv?: Cv;
  }
}

export type FrameStatus = "loading" | "searching" | "document" | "receipt";

// Loaded from CDN for now (not vendored into public/) — quick to try, no
// repo bloat; worth self-hosting later if this feature is kept.
const OPENCV_SRC = "https://cdn.jsdelivr.net/npm/@techstark/opencv-js@4.9.0-release.1/dist/opencv.js";

const DETECT_INTERVAL_MS = 300;
const OCR_INTERVAL_MS = 1500;
// Downscaled width fed to OpenCV — contour detection on a small frame is
// what keeps this cheap enough to run several times a second; the full
// camera resolution is never touched by this detector.
const DETECT_WIDTH = 320;
// A candidate rectangle must cover at least this fraction of the (downscaled)
// frame to count — filters out small unrelated edges (fingers, table lines).
const MIN_DOCUMENT_AREA_RATIO = 0.15;

// Pure geometry + pixel intensity — no notion of "receipt" at all, so this
// only asks "is a roughly-rectangular object in frame."
function findDocumentContour(cv: Cv, src: Cv): boolean {
  const gray = new cv.Mat();
  const blurred = new cv.Mat();
  const edges = new cv.Mat();
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  try {
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
    cv.Canny(blurred, edges, 50, 150);
    cv.dilate(edges, edges, cv.Mat.ones(3, 3, cv.CV_8U));
    cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    const frameArea = src.rows * src.cols;
    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const area = cv.contourArea(contour);
      if (area > frameArea * MIN_DOCUMENT_AREA_RATIO) {
        const peri = cv.arcLength(contour, true);
        const approx = new cv.Mat();
        cv.approxPolyDP(contour, approx, 0.02 * peri, true);
        const isRectangular = approx.rows === 4;
        approx.delete();
        contour.delete();
        if (isRectangular) return true;
        continue;
      }
      contour.delete();
    }
    return false;
  } finally {
    gray.delete();
    blurred.delete();
    edges.delete();
    contours.delete();
    hierarchy.delete();
  }
}

function loadOpenCv(): Promise<void> {
  if (window.cv?.Mat) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${OPENCV_SRC}"]`);
    const onReady = () => {
      const cv = window.cv;
      if (!cv) {
        reject(new Error("OpenCV script loaded but window.cv is missing"));
      } else if (cv.Mat) {
        resolve();
      } else {
        cv.onRuntimeInitialized = () => resolve();
      }
    };
    if (existing) {
      existing.addEventListener("load", onReady, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = OPENCV_SRC;
    script.async = true;
    script.addEventListener("load", onReady, { once: true });
    script.addEventListener("error", () => reject(new Error("Failed to load OpenCV")), { once: true });
    document.head.appendChild(script);
  });
}

// Content signals a real receipt tends to have, as opposed to any other
// rectangular thing (a book, a card, a blank page) — a currency/keyword hit
// plus at least one price-shaped number, not just a rectangle in frame.
const RECEIPT_KEYWORDS = /total|subtotal|tax|gst|sst|amount|cash|change|qty|receipt/i;
const PRICE_PATTERN = /\d+[.,]\d{2}/;

// Live, local-only "does this look like a receipt" signal for the camera
// view — OpenCV finds a document-shaped rectangle (fast, every ~300ms),
// Tesseract OCR then checks its actual text content for receipt-like
// keywords/prices (slower, every ~1.5s, only once a rectangle is held
// steady) before upgrading the status to "receipt". No DeepSeek calls
// happen here — this never costs anything per frame, unlike the earlier
// reverted auto-capture polling.
export function useReceiptFrameDetector(videoRef: RefObject<HTMLVideoElement | null>, active: boolean): FrameStatus {
  const [status, setStatus] = useState<FrameStatus>("loading");
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    let detectTimer: ReturnType<typeof setInterval> | undefined;
    let ocrTimer: ReturnType<typeof setInterval> | undefined;
    let ocrBusy = false;
    let documentSince: number | null = null;
    const detectCanvas = document.createElement("canvas");

    (async () => {
      try {
        await loadOpenCv();
      } catch {
        // No detector this session — the manual shutter still works fine.
        return;
      }
      if (cancelled) return;
      setStatus("searching");

      const worker = await createWorker("eng");
      if (cancelled) {
        await worker.terminate();
        return;
      }
      workerRef.current = worker;

      detectTimer = setInterval(() => {
        const video = videoRef.current;
        const cv = window.cv;
        if (!video || !cv || video.readyState < 2 || video.videoWidth === 0) return;

        const scale = DETECT_WIDTH / video.videoWidth;
        detectCanvas.width = DETECT_WIDTH;
        detectCanvas.height = Math.round(video.videoHeight * scale);
        const ctx = detectCanvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, detectCanvas.width, detectCanvas.height);

        const src = cv.imread(detectCanvas);
        let hasDocument = false;
        try {
          hasDocument = findDocumentContour(cv, src);
        } finally {
          src.delete();
        }

        if (hasDocument) {
          if (documentSince === null) documentSince = Date.now();
          setStatus((prev) => (prev === "receipt" ? "receipt" : "document"));
        } else {
          documentSince = null;
          setStatus("searching");
        }
      }, DETECT_INTERVAL_MS);

      ocrTimer = setInterval(async () => {
        if (ocrBusy || documentSince === null) return;
        // Let the shape detector settle before spending an OCR pass, so it's
        // not reading a half-framed or still-moving shot.
        if (Date.now() - documentSince < 400) return;
        const video = videoRef.current;
        if (!video || video.readyState < 2) return;

        ocrBusy = true;
        try {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const { data } = await worker.recognize(canvas);
          if (RECEIPT_KEYWORDS.test(data.text) && PRICE_PATTERN.test(data.text)) {
            setStatus("receipt");
          }
        } catch {
          // OCR is a best-effort upgrade signal — a failed pass just leaves
          // status at "document" rather than surfacing an error to the user.
        } finally {
          ocrBusy = false;
        }
      }, OCR_INTERVAL_MS);
    })();

    return () => {
      cancelled = true;
      if (detectTimer) clearInterval(detectTimer);
      if (ocrTimer) clearInterval(ocrTimer);
      workerRef.current?.terminate();
      workerRef.current = null;
      // Reset for next time (e.g. the camera is closed and reopened) —
      // done in cleanup rather than the effect body so it's tied to this
      // active session actually ending, not a synchronous render-time call.
      setStatus("loading");
    };
  }, [active, videoRef]);

  return status;
}
