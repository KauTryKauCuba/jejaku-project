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

export async function saveAvatarPhoto(file: File): Promise<string> {
  const extension = ALLOWED_TYPES[file.type];
  if (!extension) {
    throw new Error("Unsupported file type.");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("File is too large.");
  }

  await mkdir(AVATAR_UPLOADS_DIR, { recursive: true });

  const filename = `${randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(AVATAR_UPLOADS_DIR, filename), buffer);

  // Must be absolute: jejaku-receipt renders this same avatarUrl (via the
  // shared session) from its own origin, where a relative path would 404.
  const base = (process.env.NEXT_PUBLIC_JEJAKU_URL ?? "").replace(/\/+$/, "");
  return `${base}/uploads/avatars/${filename}`;
}
