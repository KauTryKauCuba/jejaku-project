"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Flashlight, X } from "@phosphor-icons/react";

// Torch control isn't part of the standard TS DOM types — it's a real but
// non-standard capability (Chrome/Android only; no iOS Safari, no desktop).
type TorchCapabilities = MediaTrackCapabilities & { torch?: boolean };
type TorchConstraints = MediaTrackConstraints & { advanced?: { torch?: boolean }[] };

// Gap between the end of one readiness check and the start of the next —
// small on purpose. The real floor on speed is DeepSeek's own response
// time (~0.6-0.7s per call), so back-to-back checks beat a fixed interval,
// which was leaving up to a second of dead time between reads.
const READY_CHECK_GAP_MS = 100;
// Require back-to-back "ready" reads before auto-capturing, so a single
// lucky frame (or the model being wrong once) doesn't fire the shutter
// on a half-framed or motion-blurred shot.
const READY_STREAK_TO_CAPTURE = 2;

// Cheap local motion check so we only spend a DeepSeek call once the phone
// has actually stopped moving — most polling during "still positioning the
// shot" was pure waste otherwise. Runs on a tiny downscaled canvas; this is
// a rounding error next to the cost of decoding the camera feed itself.
const MOTION_SAMPLE_SIZE = 24;
const MOTION_CHECK_INTERVAL_MS = 120;
const MOTION_DIFF_THRESHOLD = 8;
const STILL_HOLD_MS = 300;

// Hard ceiling on DeepSeek calls per camera session. If auto-detect hasn't
// locked on by then (bad lighting, awkward angle, whatever), stop spending
// money on it and let the user fall back to the manual shutter — a user who
// leaves the camera open and walks away should not run up an unbounded bill.
const MAX_READY_ATTEMPTS = 10;

export default function CameraCapture({
  onCapture,
  onCancel,
}: {
  onCapture: (file: File) => void;
  onCancel: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readyStreakRef = useRef(0);
  const capturedRef = useRef(false);
  const isStillRef = useRef(false);
  const attemptsRef = useRef(0);
  const [error, setError] = useState<string | undefined>(undefined);
  const [ready, setReady] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [autoStatus, setAutoStatus] = useState<"scanning" | "found" | "stopped">("scanning");

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  useEffect(() => {
    let cancelled = false;

    navigator.mediaDevices
      ?.getUserMedia({
        video: {
          facingMode: "environment",
          // Full HD is plenty sharp for a receipt photo — asking for the
          // device's max resolution made the live preview laggy on phones,
          // since decoding/rendering a near-4K+ video feed continuously is
          // heavy. This still lets the browser pick lower if the device
          // can't do 1080p.
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setReady(true);

        const track = stream.getVideoTracks()[0];
        const capabilities = track?.getCapabilities?.() as TorchCapabilities | undefined;
        setTorchSupported(capabilities?.torch === true);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Couldn't access the camera. Check your browser's camera permission, or import a photo instead.");
        }
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const capture = () => {
    const video = videoRef.current;
    if (!video) return;
    capturedRef.current = true;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onCapture(new File([blob], `receipt-${Date.now()}.jpg`, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92
    );
  };

  // Local-only: watches for the camera to hold still, no network involved.
  useEffect(() => {
    if (!ready) return;

    const canvas = document.createElement("canvas");
    canvas.width = MOTION_SAMPLE_SIZE;
    canvas.height = MOTION_SAMPLE_SIZE;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    let previousFrame: Uint8ClampedArray | null = null;
    let stillSince: number | null = null;

    const interval = setInterval(() => {
      const video = videoRef.current;
      if (!ctx || !video || !video.videoWidth || capturedRef.current) return;

      ctx.drawImage(video, 0, 0, MOTION_SAMPLE_SIZE, MOTION_SAMPLE_SIZE);
      const frame = ctx.getImageData(0, 0, MOTION_SAMPLE_SIZE, MOTION_SAMPLE_SIZE).data;

      if (previousFrame) {
        let diffSum = 0;
        for (let i = 0; i < frame.length; i += 4) {
          diffSum +=
            Math.abs(frame[i] - previousFrame[i]) +
            Math.abs(frame[i + 1] - previousFrame[i + 1]) +
            Math.abs(frame[i + 2] - previousFrame[i + 2]);
        }
        const avgDiff = diffSum / (frame.length / 4) / 3;
        const now = Date.now();

        if (avgDiff < MOTION_DIFF_THRESHOLD) {
          if (stillSince === null) stillSince = now;
          isStillRef.current = now - stillSince >= STILL_HOLD_MS;
        } else {
          stillSince = null;
          isStillRef.current = false;
        }
      }

      previousFrame = frame;
    }, MOTION_CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const checkReady = async () => {
      const video = videoRef.current;
      if (!video || capturedRef.current) return;

      // Skip the DeepSeek call entirely while the phone is still moving —
      // that frame is stale by the time a response would come back anyway,
      // so it's a call spent for nothing.
      if (!isStillRef.current) {
        if (!cancelled) timeoutId = setTimeout(checkReady, MOTION_CHECK_INTERVAL_MS);
        return;
      }

      if (attemptsRef.current >= MAX_READY_ATTEMPTS) {
        setAutoStatus("stopped");
        return;
      }
      attemptsRef.current += 1;

      try {
        const scale = Math.min(1, 800 / video.videoWidth);
        const small = document.createElement("canvas");
        small.width = Math.round(video.videoWidth * scale);
        small.height = Math.round(video.videoHeight * scale);
        const ctx = small.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, small.width, small.height);
        const dataUrl = small.toDataURL("image/jpeg", 0.85);

        const res = await fetch("/api/receipt-ready", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: dataUrl }),
        });
        const data = res.ok ? ((await res.json()) as { ready?: boolean }) : { ready: false };

        if (data.ready) {
          readyStreakRef.current += 1;
          setAutoStatus(readyStreakRef.current >= READY_STREAK_TO_CAPTURE ? "found" : "scanning");
          if (readyStreakRef.current >= READY_STREAK_TO_CAPTURE && !capturedRef.current) {
            capture();
            return;
          }
        } else {
          readyStreakRef.current = 0;
          setAutoStatus("scanning");
        }
      } catch {
        readyStreakRef.current = 0;
      }

      if (!cancelled) {
        timeoutId = setTimeout(checkReady, READY_CHECK_GAP_MS);
      }
    };

    checkReady();
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next }] } as TorchConstraints);
      setTorchOn(next);
    } catch {
      // Some devices report torch as a capability but reject applying it —
      // fail quietly, the button just won't toggle.
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink">
      <div className="flex items-center justify-between p-[19px]">
        <p className="text-[14px] font-medium text-canvas">Scan a receipt</p>
        <div className="flex items-center gap-[8px]">
          {torchSupported && (
            <button
              type="button"
              onClick={toggleTorch}
              aria-label={torchOn ? "Turn off torch" : "Turn on torch"}
              aria-pressed={torchOn}
              className={
                torchOn
                  ? "flex h-[33px] w-[33px] items-center justify-center rounded-pill bg-canvas text-ink transition-colors"
                  : "flex h-[33px] w-[33px] items-center justify-center rounded-pill bg-canvas/10 text-canvas transition-colors hover:bg-canvas/20"
              }
            >
              <Flashlight size={16} weight={torchOn ? "fill" : "light"} />
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close camera"
            className="flex h-[33px] w-[33px] items-center justify-center rounded-pill bg-canvas/10 text-canvas transition-colors hover:bg-canvas/20"
          >
            <X size={16} weight="light" />
          </button>
        </div>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {error ? (
          <p className="max-w-xs px-[23px] text-center text-[13px] leading-relaxed text-canvas-soft">
            {error}
          </p>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-x-0 top-[15px] flex justify-center px-[23px]">
              <span
                className={
                  autoStatus === "found"
                    ? "rounded-pill bg-canvas px-[13px] py-[6px] text-center text-[12px] font-medium text-ink"
                    : "rounded-pill bg-ink/60 px-[13px] py-[6px] text-center text-[12px] font-medium text-canvas"
                }
              >
                {autoStatus === "found"
                  ? "Got it — capturing…"
                  : autoStatus === "stopped"
                    ? "Auto-detect paused — tap the shutter to capture"
                    : "Looking for a receipt…"}
              </span>
            </div>
            {autoStatus !== "stopped" && (
              <div
                className="scan-line pointer-events-none absolute inset-x-0 h-[3px] bg-canvas/80 shadow-[0_0_12px_2px_rgba(255,255,255,0.5)]"
                aria-hidden="true"
              />
            )}
          </>
        )}
      </div>

      <div className="flex items-center justify-center p-[23px] pb-[38px]">
        {error ? (
          <button
            type="button"
            onClick={onCancel}
            className="flex h-[41px] items-center justify-center rounded-pill border border-canvas/30 bg-canvas/10 px-[23px] text-[14px] font-medium text-canvas transition-colors hover:bg-canvas/20"
          >
            Close
          </button>
        ) : (
          <button
            type="button"
            onClick={capture}
            disabled={!ready}
            aria-label="Capture photo now instead of waiting for auto-detect"
            className="flex h-[64px] w-[64px] items-center justify-center rounded-full border-4 border-canvas bg-canvas/20 transition-transform active:scale-95 disabled:opacity-50"
          >
            <Camera size={22} weight="fill" className="text-canvas" />
          </button>
        )}
      </div>
    </div>
  );
}
