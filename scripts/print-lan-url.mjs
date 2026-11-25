import { networkInterfaces } from "node:os";

function lanIp() {
  const nets = networkInterfaces();
  for (const addrs of Object.values(nets)) {
    if (!addrs) continue;
    for (const addr of addrs) {
      if (addr.family === "IPv4" && !addr.internal) return addr.address;
    }
  }
  return null;
}

const port = process.env.PORT || "3010";
const ip = lanIp();
console.log("");
if (ip) {
  console.log("  Celular (misma WiFi):");
  console.log(`  → http://${ip}:${port}`);
  console.log(`  → Planos (admin): http://${ip}:${port}/mi-taller/planos`);
} else {
  console.log("  Celular: conecta el Mac a WiFi y revisa la línea Network en la salida de Next.");
}
console.log("");