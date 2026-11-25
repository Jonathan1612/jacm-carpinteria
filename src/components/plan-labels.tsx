/** Etiquetas nombre + medidas en el SVG del plano. */

function fmt(n: number | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return n % 1 === 0 ? String(n) : n.toFixed(1);
}

export function planMeasureLines(
  m: { widthCm: number; heightCm: number; depthCm?: number; drawerCount?: number },
  kind: string,
) {
  if (kind === "shelf-board") {
    return [`L${fmt(m.widthCm)}×P${fmt(m.depthCm)} · e${fmt(m.heightCm)}`];
  }
  if (kind === "rod") {
    return [`L${fmt(m.widthCm)} Ø${fmt(m.heightCm)} h${fmt(m.depthCm)}`];
  }
  if (kind === "divider") {
    return [`F${fmt(m.widthCm)}×A${fmt(m.heightCm)} · e${fmt(m.depthCm)}`];
  }
  if (kind === "carcass") {
    return [`F${fmt(m.widthCm)}×A${fmt(m.heightCm)} · e${fmt(m.depthCm)}`];
  }
  if (kind === "door") {
    return [`${fmt(m.widthCm)}×${fmt(m.heightCm)} cm`];
  }
  if (kind === "drawer") {
    const n = m.drawerCount ?? 0;
    return n > 0
      ? [`${n} caj. · ${fmt(m.widthCm)}×${fmt(m.heightCm)}`]
      : [`${fmt(m.widthCm)}×${fmt(m.heightCm)} cm`];
  }
  if (kind === "drawer-front") {
    return [`${fmt(m.widthCm)}×${fmt(m.heightCm)} cm`];
  }
  const d = m.depthCm != null ? ` · F${fmt(m.depthCm)}` : "";
  return [`${fmt(m.widthCm)}×${fmt(m.heightCm)} cm${d}`];
}

function wrapWords(text: string, maxChars: number): string[] {
  if (maxChars < 4) return [text.slice(0, maxChars)];
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [text];
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > maxChars && cur) {
      lines.push(cur);
      cur = w.length > maxChars ? `${w.slice(0, maxChars - 1)}…` : w;
    } else {
      cur = next;
    }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 4);
}

export function planLabelInset(
  viz: { x: number; y: number; w: number; h: number },
  reserveBottom = 11,
) {
  const pad = 4;
  return {
    clipX: viz.x + 2,
    clipY: viz.y + 2,
    clipW: Math.max(viz.w - 4, 2),
    clipH: Math.max(viz.h - reserveBottom - 2, 4),
    anchorX: viz.x + viz.w / 2,
    anchorY: viz.y + 10,
    maxWidth: Math.max(viz.w - pad * 2, 8),
    maxHeight: Math.max(viz.h - reserveBottom - pad, 6),
  };
}

type LabelProps = {
  x: number;
  y: number;
  title: string;
  lines: string[];
  selected?: boolean;
  done?: boolean;
  vertical?: boolean;
  light?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  clipId?: string;
  clipX?: number;
  clipY?: number;
  clipW?: number;
  clipH?: number;
  measuresOnly?: boolean;
};

export function PlanSvgLabel({
  x,
  y,
  title,
  lines,
  selected,
  done,
  vertical,
  light,
  maxWidth = 120,
  maxHeight,
  clipId,
  clipX,
  clipY,
  clipW,
  clipH,
  measuresOnly,
}: LabelProps) {
  const titleFill = light ? "#fffdf8" : selected ? "#8a3d0f" : done ? "#176140" : "#3d2a1a";
  const subFill = light ? "#f3eee6" : "#5c5146";

  let titleSize =
    maxWidth < 44 || (maxHeight != null && maxHeight < 22) ? 6.5 : maxWidth < 62 ? 7 : maxWidth < 88 ? 8 : 9;
  let subSize = maxWidth < 50 ? 6.5 : 7;
  const titleLineH = titleSize + 2;
  const subLineH = subSize + 1;

  const approxChar = titleSize * 0.52;
  const maxChars = Math.max(6, Math.floor(maxWidth / approxChar));
  const titleLines = measuresOnly ? [] : wrapWords(title, maxChars);

  let subLines = lines.filter(Boolean);
  if (maxHeight != null) {
    const need =
      titleLines.length * titleLineH +
      (subLines.length > 0 ? 2 : 0) +
      subLines.length * subLineH;
    while (subLines.length > 1 && need > maxHeight) subLines.pop();
    if (need > maxHeight && subLines.length === 1 && titleLines.length > 2) {
      titleLines.splice(2);
    }
    if (maxHeight < 20) {
      titleLines.splice(1);
      subLines = subLines.slice(0, 1);
      titleSize = Math.min(titleSize, 6.5);
      subSize = 6.5;
    }
    if (maxHeight < 14) {
      subLines = [];
      titleLines.splice(1);
      titleSize = 6;
    }
  }

  if (titleLines.length === 0 && subLines.length === 0) return null;

  const content = (
    <>
      {titleLines.map((line, i) => (
        <text
          key={`t-${i}`}
          x={x}
          y={y + i * titleLineH}
          textAnchor="middle"
          dominantBaseline="hanging"
          fontSize={titleSize}
          fontWeight={i === 0 && (selected || done) ? 700 : 600}
          fill={titleFill}
        >
          {line}
        </text>
      ))}
      {subLines.map((line, i) => (
        <text
          key={`m-${i}`}
          x={x}
          y={y + titleLines.length * titleLineH + 2 + i * subLineH}
          textAnchor="middle"
          dominantBaseline="hanging"
          fontSize={subSize}
          fill={subFill}
        >
          {line}
        </text>
      ))}
    </>
  );

  const wrapped = vertical ? (
    <g transform={`rotate(-90 ${x} ${y})`} pointerEvents="none">
      {content}
    </g>
  ) : (
    content
  );

  if (clipId && clipW != null && clipH != null && clipX != null && clipY != null) {
    return (
      <g pointerEvents="none">
        <defs>
          <clipPath id={clipId}>
            <rect x={clipX} y={clipY} width={clipW} height={clipH} rx="2" />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>{wrapped}</g>
      </g>
    );
  }

  return <g pointerEvents="none">{wrapped}</g>;
}