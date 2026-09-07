import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { QR_UPLOADS_DIR } from "../../../lib/uploads";

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

// Same reasoning as app/uploads/expenses/[filename]/route.ts — public/ is a
// startup snapshot Next.js never rescans, so a QR photo written after the
// server started would 404 through the static file router. This reads
// straight from disk on every request instead.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;

  if (filename.includes("/") || filename.includes("..")) {
    return new NextResponse(null, { status: 400 });
  }
  const extension = filename.split(".").pop()?.toLowerCase() ?? "";
  const contentType = CONTENT_TYPES[extension];
  if (!contentType) {
    return new NextResponse(null, { status: 400 });
  }

  try {
    const buffer = await readFile(path.join(QR_UPLOADS_DIR, filename));
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
