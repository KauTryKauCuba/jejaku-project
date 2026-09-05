"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Flashlight, X } from "@phosphor-icons/react";

// Torch control isn't part of the standard TS DOM types — it's a real but
// non-standard capability (Chrome/Android only; no iOS Safari, no desktop).
type TorchCapabilities = MediaTrackCapabilities & { torch?: boolean };
type TorchConstraints = MediaTrackConstraints & { advanced?: { torch?: boolean }[] };

// ImageCapture.takePhoto() returns the camera's native still-photo
// resolution uncapped — often well above 4K on modern phones — which was
// making both the upload and DeepSeek's own read of it noticeably slower.
// Downscaling to this cap keeps the legibility win over the old
// video-frame-only capture without sending a 12+ megapixel photo over the
// network. Applied once, after capture — never touches the live preview.
const MAX_CAPTURE_DIMENSION = 2400;

export default function CameraCapture({
  onCapture,
  onCancel,
}: {
  onCapture: (file: File) => void;
  onCancel: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | undefined>(undefined);
  const [ready, setReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

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
          // Full HD keeps the *live preview* smooth — decoding/rendering a
          // near-4K+ video feed continuously is heavy on phones (confirmed
          // laggy at 3840x2160 here). The actual captured photo is sharper
          // than this: `capture()` below prefers the browser's separate
          // still-photo API (ImageCapture.takePhoto()), which many phone
          // cameras can serve at a much higher resolution than the video
          // track's own constraints, independent of this preview stream.
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

  const capture = async () => {
    const video = videoRef.current;
    if (!video || capturing) return;
    setCapturing(true);

    try {
      // Prefer the browser's still-photo capture API over the live video
      // frame — on most phone cameras it can serve a meaningfully higher
      // resolution than the video track itself, without needing to run the
      // *live preview* at that resolution (which was laggy on lower-end
      // phones). Falls back to grabbing the current video frame wherever
      // this isn't supported (notably Safari/iOS, which doesn't implement
      // takePhoto()) or the device rejects it.
      let source: CanvasImageSource = video;
      let sourceWidth = video.videoWidth;
      let sourceHeight = video.videoHeight;

      const track = streamRef.current?.getVideoTracks()[0];
      if (track && typeof ImageCapture !== "undefined") {
        try {
          const photoBlob = await new ImageCapture(track).takePhoto();
          const bitmap = await createImageBitmap(photoBlob);
          source = bitmap;
          sourceWidth = bitmap.width;
          sourceHeight = bitmap.height;
        } catch {
          // Fall through to the video-frame source above.
        }
      }

      const longestSide = Math.max(sourceWidth, sourceHeight);
      const scale = longestSide > MAX_CAPTURE_DIMENSION ? MAX_CAPTURE_DIMENSION / longestSide : 1;

      const canvas = document.createElement("canvas");
      canvas.width = Math.round(sourceWidth * scale);
      canvas.height = Math.round(sourceHeight * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      // Boost contrast before DeepSeek ever sees this — thermal-printed
      // receipts are often faint gray, not true black, and crumpled/glared
      // photos make it worse. Pushing contrast up (and brightness slightly)
      // darkens real ink and lightens the background, which reads much
      // closer to a clean scan. Applied only to the captured frame, not the
      // live preview, so what the user sees while framing the shot stays
      // natural.
      ctx.filter = "contrast(150%) brightness(108%)";
      ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
      ctx.filter = "none";

      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          onCapture(new File([blob], `receipt-${Date.now()}.jpg`, { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.92
      );
    } finally {
      setCapturing(false);
    }
  };

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
    <div className="fixed inset-0 z-50 overflow-hidden bg-ink">
      {error ? (
        <div className="flex h-full flex-col items-center justify-center p-[23px]">
          <p className="max-w-xs text-center text-[13px] leading-relaxed text-canvas-soft">
            {error}
          </p>
          <button
            type="button"
            onClick={onCancel}
            className="mt-[19px] flex h-[41px] items-center justify-center rounded-pill border border-canvas/30 bg-canvas/10 px-[23px] text-[14px] font-medium text-canvas transition-colors hover:bg-canvas/20"
          >
            Close
          </button>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 h-full w-full object-cover"
          />

          <div
            // No box-shadow, per DESIGN.md — the site is shadow-free
            // throughout. Full opacity instead of a glow to stay visible.
            className="scan-line pointer-events-none absolute inset-x-0 h-[2px] bg-canvas"
            aria-hidden="true"
          />

          {/* Scrims behind the floating controls only, not the whole
              screen — keeps the preview genuinely full-bleed while still
              keeping the header/footer controls legible over any frame. */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[110px] bg-gradient-to-b from-ink/60 to-transparent"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[160px] bg-gradient-to-t from-ink/60 to-transparent"
            aria-hidden="true"
          />

          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-[19px]">
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

          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-[15px] p-[23px] pb-[38px]">
            <p className="max-w-[30ch] text-center text-[12px] font-medium text-canvas">
              Lay it flat, keep the whole receipt in frame, and make sure it&apos;s well lit
            </p>
            {/* The one AI call in this app that happens on a photo — sent
                to DeepSeek to read it, not stored there. Anywhere else a
                receipt image is added (import photo/PDF, manual entry) it
                stays local, no AI call. */}
            <p className="max-w-[30ch] text-center text-[11px] text-canvas/70">
              This photo is sent to DeepSeek to read it — not stored there.
            </p>
            <button
              type="button"
              onClick={capture}
              disabled={!ready || capturing}
              aria-label="Capture photo"
              className="flex h-[64px] w-[64px] items-center justify-center rounded-full border-4 border-canvas bg-canvas/20 transition-transform active:scale-95 disabled:opacity-50"
            >
              <Camera size={22} weight="fill" className="text-canvas" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
