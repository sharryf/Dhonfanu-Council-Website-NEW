import "server-only";
import { randomBytes } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { slugify } from "./format";

export const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

const IMAGE_EXT = ["jpg", "jpeg", "png", "webp", "gif"];
const DOCUMENT_EXT = ["pdf", "doc", "docx", "xls", "xlsx"];

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;

export const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

export type SavedUpload = { url: string; name: string; size: number; ext: string };

export class UploadError extends Error {}

function startsWith(buf: Buffer, bytes: number[]): boolean {
  return bytes.every((b, i) => buf[i] === b);
}

/** Checks the file's leading bytes so a renamed file cannot slip through. */
function contentMatches(ext: string, buf: Buffer): boolean {
  switch (ext) {
    case "pdf":
      return buf.subarray(0, 5).toString("latin1") === "%PDF-";
    case "png":
      return startsWith(buf, [0x89, 0x50, 0x4e, 0x47]);
    case "jpg":
    case "jpeg":
      return startsWith(buf, [0xff, 0xd8, 0xff]);
    case "gif":
      return buf.subarray(0, 4).toString("latin1") === "GIF8";
    case "webp":
      return buf.subarray(0, 4).toString("latin1") === "RIFF" && buf.subarray(8, 12).toString("latin1") === "WEBP";
    case "docx":
    case "xlsx":
      return startsWith(buf, [0x50, 0x4b]); // zip container
    case "doc":
    case "xls":
      return startsWith(buf, [0xd0, 0xcf, 0x11, 0xe0]); // OLE container
    default:
      return false;
  }
}

/**
 * Saves an uploaded file under /public/uploads/<year>/ and returns its public URL.
 * Returns null when no file was selected.
 */
export async function saveUpload(file: unknown, kind: "image" | "document"): Promise<SavedUpload | null> {
  if (!(file instanceof File) || file.size === 0) return null;

  const original = file.name || "file";
  const ext = (original.split(".").pop() || "").toLowerCase();
  const allowed = kind === "image" ? IMAGE_EXT : DOCUMENT_EXT;
  if (!allowed.includes(ext)) {
    throw new UploadError(`"${original}" is not an allowed file type. Allowed: ${allowed.join(", ")}.`);
  }

  const max = kind === "image" ? MAX_IMAGE_BYTES : MAX_DOCUMENT_BYTES;
  if (file.size > max) {
    throw new UploadError(`"${original}" is too large. The limit is ${Math.round(max / 1024 / 1024)} MB.`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!contentMatches(ext, buffer)) {
    throw new UploadError(`"${original}" does not look like a valid .${ext} file.`);
  }

  const year = String(new Date().getFullYear());
  const base = slugify(original.replace(/\.[^.]+$/, "")) || "file";
  const fileName = `${Date.now().toString(36)}${randomBytes(3).toString("hex")}-${base}.${ext}`;
  const dir = path.join(UPLOAD_ROOT, year);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, fileName), buffer);

  return { url: `/uploads/${year}/${fileName}`, name: original, size: file.size, ext };
}

/** Resolves a /uploads/... URL to a path on disk, or null if it is not a safe upload path. */
export function resolveUploadPath(url: string): string | null {
  if (!url.startsWith("/uploads/")) return null;
  const relative = decodeURIComponent(url.slice("/uploads/".length));
  const full = path.resolve(UPLOAD_ROOT, relative);
  if (full !== UPLOAD_ROOT && !full.startsWith(UPLOAD_ROOT + path.sep)) return null;
  return full;
}

/** Deletes a previously uploaded file. Bundled images in /images are never touched. */
export async function removeUpload(url: string | null | undefined) {
  if (!url) return;
  const full = resolveUploadPath(url);
  if (!full || full === UPLOAD_ROOT) return;
  try {
    await unlink(full);
  } catch {
    // already gone — nothing to do
  }
}
