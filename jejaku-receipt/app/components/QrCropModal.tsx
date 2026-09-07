"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { getCroppedImageDataUrl, type CropPixels } from "../lib/cropImage";
import Modal from "./Modal";

// Square, not round (AvatarCropModal's cropShape="round") — a QR code
// needs its full square intact, corner finder patterns included, or a
// scanner can't lock onto it.
export default function QrCropModal({
  imageSrc,
  onCancel,
  onSave,
}: {
  imageSrc: string;
  onCancel: () => void;
  onSave: (croppedDataUrl: string) => void;
}) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropPixels | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setSaving(true);
    setError(undefined);
    try {
      const dataUrl = await getCroppedImageDataUrl(imageSrc, croppedAreaPixels);
      onSave(dataUrl);
    } catch {
      setError("Couldn't crop that image. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Crop QR code" onClose={onCancel}>
      <p className="text-[12px] text-ink-mute">Drag to reposition, use the slider to zoom — keep the whole code in frame.</p>

      <div className="relative mt-[15px] h-[260px] w-full overflow-hidden rounded-md bg-canvas-soft">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="rect"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>

      <input
        type="range"
        min={1}
        max={3}
        step={0.01}
        value={zoom}
        onChange={(e) => setZoom(Number(e.target.value))}
        className="mt-[15px] w-full accent-primary"
        aria-label="Zoom"
      />

      {error && <p className="mt-[11px] text-[12px] text-error">{error}</p>}

      <div className="mt-[15px] flex items-center gap-[8px]">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex h-[37px] flex-1 items-center justify-center rounded-pill bg-primary px-[15px] text-[14px] font-medium text-on-primary transition-transform active:scale-[0.98] disabled:opacity-50"
        >
          {saving ? "Cropping…" : "Use this crop"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex h-[37px] items-center justify-center rounded-pill border border-hairline-input bg-canvas px-[15px] text-[14px] font-medium text-ink-mute transition-colors hover:bg-canvas-soft"
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}
