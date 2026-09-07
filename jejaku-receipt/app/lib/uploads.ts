import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads", "expenses");
export const QR_UPLOADS_DIR = path.join(process.cwd(), "public", "uploads", "qr");
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

// Validation only — no disk write, so the two callers below can each keep
// a literal `path.join(THEIR_OWN_DIR, filename)` call. Turbopack's output
// file tracing statically resolves a filesystem path per call site; once
// that path came from a `dir` parameter instead, the whole project got
// swept into the server output ("Static analysis determined that this
// filesystem access causes the whole project to be traced" — hit exactly
// this while adding saveQrPhoto). Keeping the write calls separate, even
// though it repeats a couple of lines, is what keeps each traceable to
// its own real subfolder.
async function validateUploadedImage(
  file: File,
  allowedTypes: Record<string, string>
): Promise<{ extension: string; buffer: Buffer }> {
  const extension = allowedTypes[file.type];
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
    const acceptsPdf = "application/pdf" in allowedTypes;
    throw new Error(`That file doesn't look like a valid photo${acceptsPdf ? " or PDF" : ""}.`);
  }

  return { extension, buffer: Buffer.from(await file.arrayBuffer()) };
}

export async function saveExpensePhoto(file: File): Promise<string> {
  const { extension, buffer } = await validateUploadedImage(file, ALLOWED_TYPES);

  await mkdir(UPLOADS_DIR, { recursive: true });
  const filename = `${randomUUID()}.${extension}`;
  await writeFile(path.join(UPLOADS_DIR, filename), buffer);

  return `/uploads/expenses/${filename}`;
}

const QR_ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

// A user's payment QR always arrives as a canvas-cropped PNG (see
// QrCropModal), but validated the same defensive way as any other upload
// rather than trusted just because of where it's called from.
export async function saveQrPhoto(file: File): Promise<string> {
  const { extension, buffer } = await validateUploadedImage(file, QR_ALLOWED_TYPES);

  await mkdir(QR_UPLOADS_DIR, { recursive: true });
  const filename = `${randomUUID()}.${extension}`;
  await writeFile(path.join(QR_UPLOADS_DIR, filename), buffer);

  return `/uploads/qr/${filename}`;
}
