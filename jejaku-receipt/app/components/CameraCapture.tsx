"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Flashlight, X } from "@phosphor-icons/react";

// Torch control isn't part of the standard TS DOM types — it's a real but
// non-standard capability (Chrome/Android only; no iOS Safari, no desktop).
type TorchCapabilities = MediaTrackCapabilities & { torch?: boolean };
type TorchConstraints = MediaTrackConstraints & { advanced?: { torch?: boolean }[] };

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
            <button
              type="button"
              onClick={capture}
              disabled={!ready}
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
