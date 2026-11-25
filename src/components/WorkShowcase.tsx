"use client";

import { useCallback, useEffect, useState } from "react";
import type { ShowcaseProject } from "@/lib/showcase-projects";

type Props = {
  projects: ShowcaseProject[];
  showStockNote?: boolean;
};

const FALLBACK_IMG = "/showcase/demo-closet.svg";

function ProjectCarousel({ project }: { project: ShowcaseProject }) {
  const [index, setIndex] = useState(0);
  const [broken, setBroken] = useState<Record<number, boolean>>({});
  const total = project.images.length;
  const raw = project.images[index] ?? project.images[0];
  const img = broken[index] ? { ...raw, src: FALLBACK_IMG } : raw;

  const go = useCallback(
    (delta: number) => {
      if (total < 2) return;
      setIndex((i) => (i + delta + total) % total);
    },
    [total],
  );

  useEffect(() => {
    if (total < 2) return;
    const id = window.setInterval(() => go(1), 6000);
    return () => window.clearInterval(id);
  }, [go, total]);

  return (
    <article className={`showcase-card${project.fromTaller ? " is-taller" : ""}`}>
      <div className="showcase-media">
        <img
          key={img.src}
          src={img.src}
          alt={img.alt}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setBroken((b) => ({ ...b, [index]: true }))}
        />
        {total > 1 ? (
          <>
            <button type="button" className="showcase-nav showcase-nav--prev" aria-label="Foto anterior" onClick={() => go(-1)}>
              ‹
            </button>
            <button type="button" className="showcase-nav showcase-nav--next" aria-label="Siguiente foto" onClick={() => go(1)}>
              ›
            </button>
            <div className="showcase-dots" role="tablist" aria-label={`Fotos de ${project.title}`}>
              {project.images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Foto ${i + 1} de ${total}`}
                  className={i === index ? "is-active" : undefined}
                  onClick={() => setIndex(i)}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
      <div className="showcase-body">
        <h3>{project.title}</h3>
        <p className="showcase-sub">{project.subtitle}</p>
        <ul className="chips showcase-tags">
          {project.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      </div>
    </article>
  );
}

export function WorkShowcase({ projects, showStockNote }: Props) {
  if (projects.length === 0) {
    return <p className="muted">Muy pronto subimos fotos de trabajos terminados.</p>;
  }

  return (
    <div className="showcase">
      {showStockNote ? (
        <p className="showcase-note muted">
          Ejemplos de carpintería (clósets, cocinas, mesas) hasta que subas fotos reales en{" "}
          <strong>Administrar → Fotos</strong>. Entonces solo se verán tus trabajos.
        </p>
      ) : null}
      <div className="showcase-grid">
        {projects.map((project) => (
          <ProjectCarousel key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}