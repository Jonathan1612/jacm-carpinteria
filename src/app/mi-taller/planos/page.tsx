import type { Metadata } from "next";
import Link from "next/link";
import { ClosetDesigner } from "@/components/ClosetDesigner";
import { DevMobileHint } from "@/components/DevMobileHint";
import { PlanEstimator } from "@/components/PlanEstimator";
import { prisma } from "@/lib/db";
import { requireCarpenter } from "@/lib/session";

export const metadata: Metadata = { title: "Planos y cotización" };

export default async function PlanosAdminPage() {
  const session = await requireCarpenter();
  const materials = await prisma.material.findMany({
    where: { carpenterId: session.id, active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  const options = materials.map((m) => ({
    id: m.id,
    name: m.name,
    thicknessMm: m.thicknessMm,
    pricePerLinearMeter: m.pricePerLinearMeter,
    notes: m.notes,
  }));

  return (
    <main className="wrap section workshop">
      <div className="section-head">
        <div>
          <p className="eyebrow">Solo administrador</p>
          <h1>Planos y cotización</h1>
        </div>
        <Link className="btn btn-ghost" href="/mi-taller">
          Volver al taller
        </Link>
      </div>
      <p className="lede">
        Esto no se muestra al público. Arma planos, guarda diseños y cotiza con tus materiales registrados.
      </p>
      {process.env.NODE_ENV === "development" ? <DevMobileHint /> : null}
      <section className="panel admin-plan-panel" id="plano">
        <h2>Diseño visual del clóset</h2>
        <p className="muted">
          Arrastra colgadores, repisas y cajones; guarda en este navegador y pasa a medir cada compartimento.
        </p>
        <ClosetDesigner materials={options} />
        <h3 className="subhead">Cotizador rápido (sin secciones)</h3>
        <p className="muted">Estimado general cuando no necesitas medir zona por zona.</p>
        <PlanEstimator materials={options} />
      </section>
    </main>
  );
}