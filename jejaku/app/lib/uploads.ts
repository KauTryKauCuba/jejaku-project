import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export const AVATAR_UPLOADS_DIR = path.join(process.cwd(), "public", "uploads", "avatars");
const MAX_SIZE_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// The browser-supplied Content-Type on a multipart file part is just a
// client-asserted label, not a guarantee — a request can claim any bytes
// are "image/png". Checked against the file's actual magic bytes before
// it's ever written to disk, so the extension on a saved avatar reflects
// what the content actually is.
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
    default:
      return false;
  }
}

export async function saveAvatarPhoto(file: File): Promise<string> {
  const extension = ALLOWED_TYPES[file.type];
  if (!extension) {
    throw new Error("Unsupported file type.");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("File is too large.");
  }

  // Just the header bytes the magic-byte check actually needs — reading
  // the whole file into memory only pays off once it's already confirmed
  // to be worth saving, not on every rejected upload too.
  const header = Buffer.from(await file.slice(0, 12).arrayBuffer());
  if (!matchesDeclaredType(header, file.type)) {
    throw new Error("That file doesn't look like a valid image.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  await mkdir(AVATAR_UPLOADS_DIR, { recursive: true });

  const filename = `${randomUUID()}.${extension}`;
  await writeFile(path.join(AVATAR_UPLOADS_DIR, filename), buffer);

  // Must be absolute: jejaku-receipt renders this same avatarUrl (via the
  // shared session) from its own origin, where a relative path would 404.
  // Deliberately AUTH_URL, not NEXT_PUBLIC_JEJAKU_URL — NEXT_PUBLIC_ vars get
  // inlined at build time wherever referenced (including server code), and
  // this app's Dockerfile never passes that one through as a build arg, so
  // it would bake in empty. AUTH_URL holds the same value but is a plain
  // runtime env var, read fresh on every request.
  const base = (process.env.AUTH_URL ?? "").replace(/\/+$/, "");
  return `${base}/uploads/avatars/${filename}`;
}
