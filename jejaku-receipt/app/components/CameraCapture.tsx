"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, X } from "@phosphor-icons/react";

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
          // No hard cap — ask for as much as the device's camera can give,
          // and the browser negotiates down to whatever it actually supports.
          width: { ideal: 8192 },
          height: { ideal: 8192 },
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

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink">
      <div className="flex items-center justify-between p-[19px]">
        <p className="text-[14px] font-medium text-canvas">Scan a receipt</p>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close camera"
          className="flex h-[33px] w-[33px] items-center justify-center rounded-pill bg-canvas/10 text-canvas transition-colors hover:bg-canvas/20"
        >
          <X size={16} weight="light" />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {error ? (
          <p className="max-w-xs px-[23px] text-center text-[13px] leading-relaxed text-canvas-soft">
            {error}
          </p>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
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
            aria-label="Capture photo"
            className="flex h-[64px] w-[64px] items-center justify-center rounded-full border-4 border-canvas bg-canvas/20 transition-transform active:scale-95 disabled:opacity-50"
          >
            <Camera size={22} weight="fill" className="text-canvas" />
          </button>
        )}
      </div>
    </div>
  );
}
