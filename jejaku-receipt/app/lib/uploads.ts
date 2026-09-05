import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads", "expenses");
// Exported so other routes that handle an image before it ever becomes a
// File (e.g. receipt-extract's base64 payload) can enforce the same
// ceiling instead of inventing their own number.
export const MAX_UPLOAD_SIZE_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export async function saveExpensePhoto(file: File): Promise<string> {
  const extension = ALLOWED_TYPES[file.type];
  if (!extension) {
    throw new Error("Unsupported file type.");
  }
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new Error("File is too large.");
  }

  await mkdir(UPLOADS_DIR, { recursive: true });

  const filename = `${randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOADS_DIR, filename), buffer);

  return `/uploads/expenses/${filename}`;
}
