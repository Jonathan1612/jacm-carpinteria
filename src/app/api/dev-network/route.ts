import { getLanIPv4 } from "@/lib/lan-ip";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return Response.json({ available: false });
  }
  const ip = getLanIPv4();
  const port = process.env.PORT ?? "3010";
  if (!ip) {
    return Response.json({ available: true, url: null, message: "No se detectó IP de red. Usa la que muestra la terminal al correr npm run dev." });
  }
  return Response.json({
    available: true,
    url: `http://${ip}:${port}`,
    pathPlano: `http://${ip}:${port}/#plano`,
  });
}