import Link from "next/link";
import { PRODUCT_NAME, PRODUCT_TAGLINE } from "@/lib/brand";
import { ThemeToggle } from "@/components/ThemeToggle";
import { prisma } from "@/lib/db";
import { logout } from "@/lib/actions";
import { getCurrentCarpenter } from "@/lib/session";

export async function SiteHeader() {
  const user = await getCurrentCarpenter();
  const pending = user
    ? await prisma.visitRequest.count({ where: { carpenterId: user.id, status: "nueva" } })
    : 0;

  return (
    <header className="header">
      <div className="header-inner">
        <Link href="/" className="brand">
          <span className="mark" aria-hidden="true">
            J
          </span>
          <span>
            <strong>{PRODUCT_NAME}</strong>
            <small>{PRODUCT_TAGLINE}</small>
          </span>
        </Link>
        <nav className="nav">
          <ThemeToggle />
          <Link href="/#trabajos">Trabajos</Link>
          <Link href="/#materiales">Materiales</Link>
          <Link href="/#contacto">Contacto</Link>
          {user ? (
            <>
              <Link href="/mi-taller/planos">Planos</Link>
              <Link href="/mi-taller">
                Administrar
                {pending > 0 ? <span className="badge">{pending}</span> : null}
              </Link>
              <form action={logout}>
                <button type="submit" className="linkish">
                  Salir
                </button>
              </form>
            </>
          ) : (
            <Link href="/entrar">Entrar</Link>
          )}
        </nav>
      </div>
    </header>
  );
}