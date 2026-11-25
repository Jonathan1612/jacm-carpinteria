import { networkInterfaces } from "os";

/** Dirección IPv4 en la red local (para probar en el celular). */
export function getLanIPv4(): string | null {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    const addrs = nets[name];
    if (!addrs) continue;
    for (const addr of addrs) {
      if (addr.family === "IPv4" && !addr.internal) {
        return addr.address;
      }
    }
  }
  return null;
}