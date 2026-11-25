import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { MAX_PHOTO_BYTES } from "./catalog";

export const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

export function sniffImage(buf: Buffer): "jpg" | "png" | "webp" | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.length > 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return "png";
  }
  if (
    buf.length > 12 &&
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp";
  }
  return null;
}

export async function savePhotoFile(buf: Buffer) {
  if (buf.length === 0) throw new Error("VACIA");
  if (buf.length > MAX_PHOTO_BYTES) throw new Error("TAMANO");
  const ext = sniffImage(buf);
  if (!ext) throw new Error("FORMATO");
  await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${randomBytes(16).toString("hex")}.${ext}`;
  await writeFile(path.join(UPLOAD_DIR, filename), buf);
  return filename;
}

export async function removePhotoFile(filename: string) {
  if (!/^[\w.-]+$/.test(filename)) return;
  await unlink(path.join(UPLOAD_DIR, filename)).catch(() => undefined);
}
