import type { Metadata } from "next";
import Link from "next/link";
import { DeletePhotoButton } from "@/components/DeletePhotoButton";
import { MaterialsAdmin } from "@/components/MaterialsAdmin";
import { PhotoForm } from "@/components/PhotoForm";
import { ProfileForm } from "@/components/ProfileForm";
import { DAYS, MAX_PHOTOS, REQUEST_STATUS, labelFor, readIds, type RequestStatus } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { formatPhone } from "@/lib/phone";
import { requireCarpenter } from "@/lib/session";
import { updateRequestStatus } from "@/lib/actions";

export const metadata: Metadata = { title: "Administrar" };

function statusLabel(status: string) {
  if (status in REQUEST_STATUS) return REQUEST_STATUS[status as RequestStatus];
  return status;
}

export default async function MiTallerPage() {
  const session = await requireCarpenter();
  const carpenter = await prisma.carpenter.findUnique({
    where: { id: session.id },
    include: {
      photos: { orderBy: { createdAt: "desc" } },
      requests: { orderBy: { createdAt: "desc" } },
      materials: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] },
    },
  });
  if (!carpenter) return null;

  const dateFormat = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" });

  return (
    <main className="wrap section workshop">
      <div className="section-head">
        <div>
          <p className="eyebrow">Administrar</p>
          <h1>Tu taller</h1>
        </div>
        <div className="row-actions">
          <Link className="btn btn-primary" href="/mi-taller/planos">
            Planos y cotización
          </Link>
          <Link className="btn btn-ghost" href="/">
            Ver página pública
          </Link>
        </div>
      </div>
      <p className="lede">Fotos, materiales, precios y solicitudes. Los planos no se publican en el inicio.</p>

      <section className="panel">
        <h2>Ficha</h2>
        <ProfileForm
          profile={{
            name: carpenter.name,
            phone: carpenter.phone,
            city: carpenter.city,
            zone: carpenter.zone,
            bio: carpenter.bio,
            email: carpenter.email,
            services: readIds(carpenter.services),
            availableDays: readIds(carpenter.availableDays),
          }}
        />
      </section>

      <section className="panel" id="materiales">
        <MaterialsAdmin materials={carpenter.materials} />
      </section>

      <section className="panel" id="fotos">
        <h2>Fotos</h2>
        <p className="muted">
          {carpenter.photos.length} de {MAX_PHOTOS}. Las más nuevas salen primero.
        </p>
        {carpenter.photos.length > 0 ? (
          <ul className="photo-admin">
            {carpenter.photos.map((photo) => (
              <li key={photo.id}>
                <img src={`/fotos/${photo.filename}`} alt={photo.caption || "Foto de trabajo"} />
                {photo.caption ? <p>{photo.caption}</p> : <p className="muted">Sin nota</p>}
                <DeletePhotoButton id={photo.id} />
              </li>
            ))}
          </ul>
        ) : (
          <p>Todavía no hay fotos. Sube una de un trabajo ya terminado.</p>
        )}
        {carpenter.photos.length >= MAX_PHOTOS ? (
          <p>Ya tienes {MAX_PHOTOS} fotos. Quita una para subir otra.</p>
        ) : (
          <PhotoForm />
        )}
      </section>

      <section className="panel" id="solicitudes">
        <h2>Solicitudes de día</h2>
        {carpenter.requests.length === 0 ? (
          <p>Cuando alguien pida un día, aparece aquí con su teléfono y lo que necesita.</p>
        ) : (
          <div className="request-list">
            {carpenter.requests.map((request) => (
              <article key={request.id} className="request">
                <header>
                  <strong>{request.clientName}</strong>
                  <span className={`tag tag-${request.status}`}>{statusLabel(request.status)}</span>
                </header>
                <p>
                  {labelFor(request.day, DAYS)}
                  <span className="dot">·</span>
                  <a href={`tel:+52${request.clientPhone}`}>{formatPhone(request.clientPhone)}</a>
                </p>
                <p>{request.message}</p>
                <p className="muted">{dateFormat.format(request.createdAt)}</p>
                <form action={updateRequestStatus} className="row-actions">
                  <input type="hidden" name="id" value={request.id} />
                  <button className="btn btn-small btn-primary" type="submit" name="status" value="confirmada">
                    Confirmar día
                  </button>
                  <button className="btn btn-small btn-ghost" type="submit" name="status" value="ocupado">
                    Ese día no puedo
                  </button>
                </form>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
