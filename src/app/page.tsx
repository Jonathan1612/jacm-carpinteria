import Link from "next/link";
import { notFound } from "next/navigation";
import { WorkShowcase } from "@/components/WorkShowcase";
import { RequestForm } from "@/components/RequestForm";
import { DAYS, SERVICES, labelsFor, readIds } from "@/lib/catalog";
import { buildPublicShowcase } from "@/lib/public-showcase";
import { formatPhone, whatsappUrl } from "@/lib/phone";
import { getShop } from "@/lib/shop";
import { getCurrentCarpenter } from "@/lib/session";

function money(n: number) {
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
}

export default async function HomePage() {
  const shop = await getShop();
  if (!shop) notFound();

  const session = await getCurrentCarpenter();
  const services = labelsFor(readIds(shop.services), SERVICES);
  const dayIds = readIds(shop.availableDays);
  const dayOptions = DAYS.filter((day) => dayIds.includes(day.id));
  const wa = whatsappUrl(
    shop.phone,
    `Hola, vi su página y me interesa un mueble a medida en ${shop.city}.`,
  );
  const { projects, showStockNote } = buildPublicShowcase(shop.photos);

  return (
    <main className="public-home">
      <section className="hero hero--visual">
        <div className="hero-glow" aria-hidden />
        <div className="wrap hero-inner">
          <p className="eyebrow">{shop.city}</p>
          <h1 className="hero-title">
            <span className="text-gradient">{shop.name}</span>
          </h1>
          <p className="lede hero-lede">{shop.bio}</p>
          <p className="hero-meta">
            {shop.zone}
            <span className="dot">·</span>
            WhatsApp {formatPhone(shop.phone)}
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href={wa} target="_blank" rel="noreferrer">
              Escribir por WhatsApp
            </a>
            <Link className="btn btn-ghost" href="#trabajos">
              Ver trabajos
            </Link>
            {session?.id === shop.id ? (
              <Link className="btn btn-ghost" href="/mi-taller">
                Administrar
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      {services.length > 0 ? (
        <section className="wrap section section--tight">
          <ul className="chips chips--accent">
            {services.map((service) => (
              <li key={service}>{service}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="wrap section" id="trabajos">
        <div className="section-intro">
          <p className="eyebrow">Portafolio</p>
          <h2>Trabajos realizados</h2>
          <p className="lede">
            Solo carpintería: clósets, cocinas, mesas y muebles. Sube fotos tuyas en{" "}
            <Link href="/mi-taller">Administrar</Link> y los ejemplos dejan de mostrarse.
          </p>
        </div>
        <WorkShowcase projects={projects} showStockNote={showStockNote} />
      </section>

      <section className="wrap section" id="materiales">
        <div className="section-intro">
          <p className="eyebrow">Materiales</p>
          <h2>Tableros y precios orientativos</h2>
          <p className="lede">
            Referencia para que el cliente entienda opciones. Tú actualizas precios cuando cambie el proveedor.
          </p>
        </div>
        <div className="materials-grid">
          {shop.materials.map((material) => (
            <article key={material.id} className="material-card glass-card">
              <h3>{material.name}</h3>
              <p className="material-price">{money(material.pricePerLinearMeter)} / metro lineal</p>
              <p className="muted">
                Lámina {money(material.pricePerSheet)} · {material.thicknessMm} mm
              </p>
              {material.notes ? <p>{material.notes}</p> : null}
            </article>
          ))}
        </div>
      </section>

      <section className="wrap section steps-band" aria-labelledby="como-id">
        <h2 id="como-id">Cómo trabajar con nosotros</h2>
        <ol className="steps steps--cards">
          <li>
            <strong>1. Mira el portafolio</strong>
            <span>Elige ideas de clósets, cocinas o muebles.</span>
          </li>
          <li>
            <strong>2. Escríbenos</strong>
            <span>WhatsApp con medidas aproximadas o fotos del espacio.</span>
          </li>
          <li>
            <strong>3. Visita o cotización</strong>
            <span>Acordamos un día para revisar el sitio en persona.</span>
          </li>
        </ol>
      </section>

      <section className="wrap section profile-layout" id="contacto">
        <section className="work">
          <h2>Pedir un día</h2>
          <p className="muted">Sin cuenta. El carpintero ve tu mensaje en su administrador.</p>
        </section>
        <aside className="contact-card glass-card">
          <h2>Contacto</h2>
          <p className="phone">{formatPhone(shop.phone)}</p>
          <a className="btn btn-primary desktop-wa" href={wa} target="_blank" rel="noreferrer">
            Escribir por WhatsApp
          </a>
          {dayOptions.length > 0 ? (
            <>
              <h3>Días disponibles</h3>
              <ul className="chips chips--accent">
                {dayOptions.map((day) => (
                  <li key={day.id}>{day.label}</li>
                ))}
              </ul>
              <RequestForm carpenterId={shop.id} days={dayOptions} />
            </>
          ) : (
            <p>Escríbele por WhatsApp para acordar una visita.</p>
          )}
        </aside>
      </section>

      <a className="btn btn-wa wa-bar" href={wa} target="_blank" rel="noreferrer">
        Escribir por WhatsApp
      </a>
    </main>
  );
}