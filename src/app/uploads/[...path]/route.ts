import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { Readable } from "stream";
import { MIME_BY_EXT, resolveUploadPath } from "@/lib/uploads";

// Next.js only serves /public files that existed at build time. Files uploaded
// through the CMS afterwards are streamed from /public/uploads by this handler.
// It answers HTTP Range requests (206), which Safari and iOS require for video.

const HEADERS = {
  "Cache-Control": "public, max-age=31536000, immutable",
  "X-Content-Type-Options": "nosniff",
  "Accept-Ranges": "bytes",
};

const notFound = () => new Response("Not found", { status: 404 });

function stream(full: string, start: number, end: number): BodyInit {
  return Readable.toWeb(createReadStream(full, { start, end })) as unknown as ReadableStream;
}

export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const full = resolveUploadPath(`/uploads/${path.map(encodeURIComponent).join("/")}`);
  if (!full) return notFound();

  const ext = (full.split(".").pop() || "").toLowerCase();
  const type = MIME_BY_EXT[ext];
  if (!type || ext === "svg") return notFound();

  try {
    const info = await stat(full);
    if (!info.isFile()) return notFound();
    const size = info.size;

    const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get("range") ?? "");
    if (range && size > 0) {
      let start = range[1] === "" ? NaN : Number(range[1]);
      let end = range[2] === "" ? NaN : Number(range[2]);
      if (Number.isNaN(start)) {
        // Suffix range: the last N bytes.
        start = Math.max(size - (Number.isNaN(end) ? 0 : end), 0);
        end = size - 1;
      } else if (Number.isNaN(end) || end >= size) {
        end = size - 1;
      }
      if (start > end || start >= size) {
        return new Response(null, { status: 416, headers: { ...HEADERS, "Content-Range": `bytes */${size}` } });
      }
      return new Response(stream(full, start, end), {
        status: 206,
        headers: {
          ...HEADERS,
          "Content-Type": type,
          "Content-Length": String(end - start + 1),
          "Content-Range": `bytes ${start}-${end}/${size}`,
        },
      });
    }

    return new Response(stream(full, 0, Math.max(size - 1, 0)), {
      headers: { ...HEADERS, "Content-Type": type, "Content-Length": String(size) },
    });
  } catch {
    return notFound();
  }
}
