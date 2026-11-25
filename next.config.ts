import type { NextConfig } from "next";
import { networkInterfaces } from "os";

function lanIpv4(): string | null {
  try {
    const nets = networkInterfaces();
    for (const addrs of Object.values(nets)) {
      if (!addrs) continue;
      for (const addr of addrs) {
        if (addr.family === "IPv4" && !addr.internal) return addr.address;
      }
    }
  } catch {
    /* sandbox u otros entornos sin interfaces de red */
  }
  return null;
}

const lan = lanIpv4();
const allowedDevOrigins = lan ? [lan] : [];

const nextConfig: NextConfig = {
  ...(allowedDevOrigins.length ? { allowedDevOrigins } : {}),
  serverExternalPackages: ["bcryptjs", "@prisma/client"],
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
      ...(lan ? { allowedOrigins: [lan, "localhost", "127.0.0.1"] } : {}),
    },
  },
};

export default nextConfig;
