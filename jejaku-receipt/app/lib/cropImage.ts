// Same technique as jejaku's app/components/cropImage.ts (no shared
// package between the two apps to pull this from instead) — draws the
// cropped region of a source image into a fresh canvas at a fixed output
// size. PNG here rather than that file's JPEG: this is used for the QR
// share card's payment code, where JPEG's lossy compression can blur the
// fine modules a QR scanner depends on.
export type CropPixels = { x: number; y: number; width: number; height: number };

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });
}

export async function getCroppedImageDataUrl(imageSrc: string, crop: CropPixels, outputSize = 512): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, outputSize, outputSize);

  return canvas.toDataURL("image/png");
}
