import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { UPLOADS_DIR } from "../../../lib/uploads";

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  pdf: "application/pdf",
};

// Next.js only serves the `public/` folder from a snapshot taken once when
// the server process starts (see next/dist/server/lib/router-utils/filesystem.js)
// — it never rescans it. Every receipt photo is written to disk by that same
// running process well after startup, so the static-file router never learns
// about it and every upload 404s until the next restart. This route handler
// reads straight from disk on every request instead, at the exact same URL
// path the uploader already returns, so nothing else needs to change.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
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
    const buffer = await readFile(path.join(UPLOADS_DIR, filename));
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
