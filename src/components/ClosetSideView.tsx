"use client";

import {
  defaultSectionMeasures,
  depthBarWidth,
  formatCm,
  shortPlanLabel,
  type ClosetTemplate,
  type SectionMeasure,
} from "@/lib/closet-design";
import { PlanSvgLabel, planMeasureLines } from "@/components/plan-labels";

type Props = {
  template: ClosetTemplate;
  outerWidthCm: number;
  outerHeightCm: number;
  outerDepthCm: number;
  thicknessMm: number;
  sections: Record<string, SectionMeasure>;
  selectedId: string | null;
  onSelect: (id: string) => void;
};

/** Vista lateral simple: alto × fondo (no es 3D; basta para ver profundidad). */
export function ClosetSideView({
  template,
  outerWidthCm,
  outerHeightCm,
  outerDepthCm,
  thicknessMm,
  sections,
  selectedId,
  onSelect,
}: Props) {
  const reference = defaultSectionMeasures(template, outerWidthCm, outerHeightCm, outerDepthCm, thicknessMm);
  const pad = 48;
  const maxH = 320;
  const scale = maxH / outerHeightCm;
  const frame = 3.6 * scale;
  const innerH = outerHeightCm * scale;
  const innerD = outerDepthCm * scale;
  const viewW = innerD + pad * 2 + frame * 2;
  const viewH = innerH + pad * 2 + frame * 2 + 28;
  const ox = pad;
  const oy = pad;

  return (
    <svg viewBox={`0 0 ${viewW} ${viewH}`} className="elevation-svg is-side" role="img" aria-label="Vista lateral fondo">
      <rect width="100%" height="100%" fill="#fbf7f1" />
      <text x={pad} y={22} fontSize="12" fill="#5c5146">
        Vista lateral · fondo total {formatCm(outerDepthCm)} cm × alto {formatCm(outerHeightCm)} cm
      </text>
      <rect x={ox} y={oy} width={innerD + frame * 2} height={innerH + frame * 2} fill="#8d5a32" rx="4" />
      <rect x={ox + frame} y={oy + frame} width={innerD} height={innerH} fill="#f7f1e8" />
      {template.sections.map((sec) => {
        const m = sections[sec.id];
        const ref = reference[sec.id];
        if (!m || !ref) return null;
        const selected = sec.id === selectedId;
        const done = m.done;
        const y = oy + frame + sec.fy * innerH;
        const h = sec.fh * innerH;
        const depthRatio = clampDepth(m.depthCm, ref.depthCm, outerDepthCm);
        const w = innerD * depthRatio;
        const x = ox + frame + (innerD - w) / 2;
        const lines = planMeasureLines(m, sec.kind);
        const depthLine = `fondo ${formatCm(m.depthCm)} cm`;
        return (
          <g
            key={sec.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(sec.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(sec.id);
              }
            }}
            style={{ cursor: "pointer" }}
          >
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              fill={done ? "#d4e8dc" : "#e8ddd0"}
              stroke={selected ? "#c56a2d" : done ? "#1f7a4d" : "#a08060"}
              strokeWidth={selected ? 3 : 1.5}
              rx="3"
            />
            <rect x={ox + frame} y={y + h - 6} width={innerD} height={4} fill="#d9cbb8" opacity={0.5} />
            <rect
              x={ox + frame + (innerD - depthBarWidth(innerD, m.depthCm, ref.depthCm)) / 2}
              y={y + h - 6}
              width={depthBarWidth(innerD, m.depthCm, ref.depthCm)}
              height={4}
              fill={selected ? "#c56a2d" : "#7a9eb5"}
              rx="1"
            />
            {h >= 24 && w >= 36 ? (
              <PlanSvgLabel
                x={x + w / 2}
                y={y + 10}
                title={shortPlanLabel(sec.label)}
                lines={[`${lines[0] ?? ""} · ${depthLine}`].filter((s) => s.trim().length > 2)}
                selected={selected}
                done={done}
                maxWidth={w - 8}
                maxHeight={h - 12}
                clipId={`side-${sec.id}`}
                clipX={x + 2}
                clipY={y + 2}
                clipW={Math.max(w - 4, 2)}
                clipH={Math.max(h - 4, 2)}
              />
            ) : null}
          </g>
        );
      })}
      <text x={ox} y={oy + innerH + frame * 2 + 20} fontSize="11" fill="#5c5146">
        Barra azul abajo de cada zona = qué tanto usas del fondo. 3D completo no hace falta para cotizar.
      </text>
    </svg>
  );
}

function clampDepth(depthCm: number, refDepth: number, outerDepth: number): number {
  const ratio = depthCm / Math.max(outerDepth, refDepth, 1);
  return Math.min(1, Math.max(0.35, ratio));
}