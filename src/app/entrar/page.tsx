import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { DEMO_PASSWORD, SHOP } from "@/lib/demo-data";
import { getCurrentCarpenter } from "@/lib/session";

export const metadata: Metadata = { title: "Entrar" };

export default async function EntrarPage() {
  const user = await getCurrentCarpenter();
  if (user) redirect("/mi-taller");

  return (
    <main className="wrap section narrow">
      <h1>Administración del taller</h1>
      <p className="lede">Aquí publicas fotos, cambias precios de materiales y ves las solicitudes.</p>
      <LoginForm />
      <aside className="notice">
        <p>
          <strong>Usuario:</strong> {SHOP.email}
        </p>
        <p>
          <strong>Contraseña:</strong> {DEMO_PASSWORD}
        </p>
        <p className="muted">
          <Link href="/">Volver a la página pública</Link>
        </p>
      </aside>
    </main>
  );
}