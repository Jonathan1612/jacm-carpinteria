import type { SectionKind } from "@/lib/closet-design";

type GlyphProps = {
  kind: SectionKind;
  drawerCount?: number;
  className?: string;
};

/** Dibujo intuitivo por tipo (SVG escalable = mismo proportion que el bloque real). */
export function BuilderBlockGlyph({ kind, drawerCount = 3, className = "" }: GlyphProps) {
  const shelves = kind === "cubbie" ? 4 : kind === "shelf" ? 3 : kind === "top" ? 1 : 0;
  const drawers = kind === "drawer" ? Math.max(1, Math.min(8, drawerCount)) : 0;

  return (
    <svg
      className={`builder-glyph${className ? ` ${className}` : ""}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      <rect width="100" height="100" fill="transparent" />
      {kind === "hang" ? (
        <>
          <line x1="8" y1="26" x2="92" y2="26" stroke="#6a4c34" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="8" cy="26" r="3" fill="#6a4c34" />
          <circle cx="92" cy="26" r="3" fill="#6a4c34" />
          <path
            d="M 22 26 Q 40 58 50 72 Q 60 58 78 26"
            fill="none"
            stroke="#8d6b45"
            strokeWidth="1.2"
            strokeDasharray="3 2"
            opacity="0.7"
          />
        </>
      ) : null}
      {shelves > 0
        ? Array.from({ length: shelves }, (_, i) => {
            const t = (i + 1) / (shelves + 1);
            const y = t * 92 + 4;
            return (
              <g key={i}>
                <rect x="6" y={y - 2} width="88" height="4" fill="#c9a87c" stroke="#8d6b45" strokeWidth="0.8" rx="0.5" />
              </g>
            );
          })
        : null}
      {drawers > 0
        ? Array.from({ length: drawers }, (_, i) => {
            const gap = 3;
            const h = (88 - gap * (drawers + 1)) / drawers;
            const y = gap + i * (h + gap) + 6;
            return (
              <g key={i}>
                <rect
                  x="8"
                  y={y}
                  width="84"
                  height={h}
                  fill="#e0cdb0"
                  stroke="#a08060"
                  strokeWidth="1"
                  rx="2"
                />
                <rect x="72" y={y + h / 2 - 3} width="14" height="6" fill="#6a4c34" rx="1" />
              </g>
            );
          })
        : null}
      {kind === "tall" ? (
        <>
          <rect x="28" y="12" width="44" height="76" fill="none" stroke="#a89080" strokeWidth="1.5" strokeDasharray="4 3" />
          <line x1="50" y1="18" x2="50" y2="82" stroke="#c4b5a0" strokeWidth="1" opacity="0.6" />
        </>
      ) : null}
      {kind === "footer" ? <rect x="0" y="20" width="100" height="80" fill="#c8b49a" opacity="0.85" /> : null}
      {kind === "rod" ? (
        <line x1="6" y1="50" x2="94" y2="50" stroke="#6a4c34" strokeWidth="4" strokeLinecap="round" />
      ) : null}
    </svg>
  );
}

export function PaletteGlyph({ kind }: { kind: SectionKind }) {
  return <BuilderBlockGlyph kind={kind} drawerCount={3} className="is-palette" />;
}