import { readFile } from "fs/promises";
import path from "path";
import { UPLOAD_DIR } from "@/lib/photos";

const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  svg: "image/svg+xml",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ filename: string }> },
) {
  const { filename } = await context.params;
  if (!/^[\w.-]+$/.test(filename) || filename.includes("..")) {
    return new Response("Nombre no válido", { status: 400 });
  }

  try {
    const file = await readFile(path.join(UPLOAD_DIR, filename));
    const ext = filename.split(".").pop()?.toLowerCase() ?? "";
    return new Response(file, {
      headers: {
        "Content-Type": TYPES[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("No encontrada", { status: 404 });
  }
}
