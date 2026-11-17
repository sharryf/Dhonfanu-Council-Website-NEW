import { readFile, stat } from "fs/promises";
import { MIME_BY_EXT, resolveUploadPath } from "@/lib/uploads";

// Next.js only serves /public files that existed at build time. Files uploaded
// through the CMS afterwards are streamed from /public/uploads by this handler.
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const full = resolveUploadPath(`/uploads/${path.map(encodeURIComponent).join("/")}`);
  if (!full) return new Response("Not found", { status: 404 });

  const ext = (full.split(".").pop() || "").toLowerCase();
  const type = MIME_BY_EXT[ext];
  if (!type || ext === "svg") return new Response("Not found", { status: 404 });

  try {
    const info = await stat(full);
    if (!info.isFile()) return new Response("Not found", { status: 404 });
    const data = await readFile(full);
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": type,
        "Content-Length": String(info.size),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
