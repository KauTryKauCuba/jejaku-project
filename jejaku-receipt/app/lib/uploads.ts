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

// The browser-supplied Content-Type on a multipart file part is just a
// client-asserted label, not a guarantee — a request can claim any bytes
// are "image/png". Checked against the file's actual magic bytes before
// it's ever written to disk, so the extension on a saved file (and
// anything downstream that trusts it, e.g. receipt-extract sending it to
// DeepSeek as an image) reflects what the content actually is.
function matchesDeclaredType(buffer: Buffer, mimeType: string): boolean {
  switch (mimeType) {
    case "image/jpeg":
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    case "image/png":
      return (
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a
      );
    case "image/webp":
      return (
        buffer.length >= 12 &&
        buffer.toString("ascii", 0, 4) === "RIFF" &&
        buffer.toString("ascii", 8, 12) === "WEBP"
      );
    case "application/pdf":
      return buffer.toString("ascii", 0, 4) === "%PDF";
    default:
      return false;
  }
}

export async function saveExpensePhoto(file: File): Promise<string> {
  const extension = ALLOWED_TYPES[file.type];
  if (!extension) {
    throw new Error("Unsupported file type.");
  }
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new Error("File is too large.");
  }

  // Just the header bytes the magic-byte check actually needs — reading
  // the whole file into memory only pays off once it's already confirmed
  // to be worth saving, not on every rejected upload too.
  const header = Buffer.from(await file.slice(0, 12).arrayBuffer());
  if (!matchesDeclaredType(header, file.type)) {
    throw new Error("That file doesn't look like a valid photo or PDF.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  await mkdir(UPLOADS_DIR, { recursive: true });

  const filename = `${randomUUID()}.${extension}`;
  await writeFile(path.join(UPLOADS_DIR, filename), buffer);

  return `/uploads/expenses/${filename}`;
}
