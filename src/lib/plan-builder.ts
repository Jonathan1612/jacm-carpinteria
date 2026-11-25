import {
  findTemplateLayoutOverlaps,
  interiorVerticalDividerPositions,
  type ClosetTemplate,
  type SectionKind,
  type TemplateCategory,
  type TemplateSection,
} from "@/lib/closet-design";

export const BUILDER_GRID = { cols: 12, rows: 20 };

export type BuilderPiece = {
  kind: SectionKind;
  label: string;
  fw: number;
  fh: number;
  drawerDefault?: number;
};

export const BUILDER_PIECES: BuilderPiece[] = [
  { kind: "top", label: "Repisa / hueco arriba", fw: 1, fh: 0.12 },
  { kind: "hang", label: "Colgador (riel)", fw: 0.5, fh: 0.45 },
  { kind: "shelf", label: "Zona repisas", fw: 0.5, fh: 0.28 },
  { kind: "cubbie", label: "Cubículos", fw: 0.2, fh: 0.35 },
  { kind: "tall", label: "Zona alta / abrigo", fw: 0.25, fh: 0.5 },
  { kind: "drawer", label: "Bloque cajones", fw: 0.5, fh: 0.28, drawerDefault: 3 },
  { kind: "footer", label: "Zócalo / base", fw: 1, fh: 0.1 },
];

export function snapFrac(value: number, steps: number) {
  const s = Math.round(value * steps) / steps;
  return Math.min(1, Math.max(0, s));
}

export function createBlankTemplate(name = "Nuevo diseño", category: TemplateCategory = "closet"): ClosetTemplate {
  return syncTemplateMeta({
    id: `plan-${Date.now()}`,
    category,
    name,
    description: "Diseño creado en el armador del taller",
    doors: 0,
    drawers: 0,
    rails: 0,
    verticalDividers: 0,
    sections: [
      {
        id: "footer",
        label: "Zócalo frontal",
        hint: "Franja inferior",
        kind: "footer",
        fx: 0,
        fy: 0.9,
        fw: 1,
        fh: 0.1,
      },
    ],
  });
}

export function syncTemplateMeta(template: ClosetTemplate): ClosetTemplate {
  const drawers = template.sections
    .filter((s) => s.kind === "drawer")
    .reduce((n, s) => n + (s.drawerDefault ?? 1), 0);
  const rails = template.sections.filter((s) => s.kind === "hang").length;
  const verticalDividers = interiorVerticalDividerPositions(template).length;
  return {
    ...template,
    drawers,
    rails,
    verticalDividers,
  };
}

function overlapsExisting(candidate: TemplateSection, sections: TemplateSection[]): boolean {
  const t = { ...createBlankTemplate(), sections: [...sections, candidate] };
  return findTemplateLayoutOverlaps(t).length > 0;
}

export function addPieceAt(
  template: ClosetTemplate,
  piece: BuilderPiece,
  fx: number,
  fy: number,
): ClosetTemplate | { error: string } {
  const fh = Math.min(piece.fh, 0.92 - fy);
  const fw = Math.min(piece.fw, 1 - fx);
  if (fw < 0.08 || fh < 0.06) return { error: "No cabe aquí: acércate al centro del interior." };

  const id = `${piece.kind}-${Date.now().toString(36)}`;
  const sec: TemplateSection = {
    id,
    label:
      piece.kind === "drawer" && piece.drawerDefault
        ? `Bloque de ${piece.drawerDefault} cajones`
        : piece.label,
    hint: "Arrastra para mover · toca para medir después",
    kind: piece.kind,
    fx: snapFrac(fx, BUILDER_GRID.cols),
    fy: snapFrac(fy, BUILDER_GRID.rows),
    fw: snapFrac(fw, BUILDER_GRID.cols),
    fh: snapFrac(fh, BUILDER_GRID.rows),
    drawerDefault: piece.drawerDefault,
  };
  if (overlapsExisting(sec, template.sections)) {
    return { error: "Choca con otra pieza. Suéltala en otro lugar." };
  }
  return syncTemplateMeta({ ...template, sections: [...template.sections, sec] });
}

export function moveSection(
  template: ClosetTemplate,
  sectionId: string,
  fx: number,
  fy: number,
): ClosetTemplate | { error: string } {
  const others = template.sections.filter((s) => s.id !== sectionId);
  const target = template.sections.find((s) => s.id === sectionId);
  if (!target) return { error: "Pieza no encontrada" };
  const moved = {
    ...target,
    fx: snapFrac(Math.min(fx, 1 - target.fw), BUILDER_GRID.cols),
    fy: snapFrac(Math.min(fy, 1 - target.fh), BUILDER_GRID.rows),
  };
  if (overlapsExisting(moved, others)) return { error: "Choca con otra pieza." };
  const sections = template.sections.map((s) => (s.id === sectionId ? moved : s));
  return syncTemplateMeta({ ...template, sections });
}

export function removeSection(template: ClosetTemplate, sectionId: string): ClosetTemplate {
  return syncTemplateMeta({
    ...template,
    sections: template.sections.filter((s) => s.id !== sectionId),
  });
}

export function resizeSection(
  template: ClosetTemplate,
  sectionId: string,
  dw: number,
  dh: number,
): ClosetTemplate | { error: string } {
  const others = template.sections.filter((s) => s.id !== sectionId);
  const target = template.sections.find((s) => s.id === sectionId);
  if (!target) return { error: "Pieza no encontrada" };
  const fw = snapFrac(Math.min(1 - target.fx, Math.max(0.08, target.fw + dw)), BUILDER_GRID.cols);
  const fh = snapFrac(Math.min(1 - target.fy, Math.max(0.06, target.fh + dh)), BUILDER_GRID.rows);
  const { prefWidthCm: _w, prefHeightCm: _h, ...rest } = target;
  const resized = { ...rest, fw, fh };
  if (overlapsExisting(resized, others)) return { error: "Así choca con otra pieza." };
  const sections = template.sections.map((s) => (s.id === sectionId ? resized : s));
  return syncTemplateMeta({ ...template, sections });
}

export function setTemplateDoors(template: ClosetTemplate, doors: number): ClosetTemplate {
  const n = Math.max(0, Math.min(4, Math.round(doors)));
  return syncTemplateMeta({ ...template, doors: n });
}

export function setSectionDrawerCount(template: ClosetTemplate, sectionId: string, count: number): ClosetTemplate {
  const n = Math.max(1, Math.min(8, Math.round(count)));
  const sections = template.sections.map((s) =>
    s.id === sectionId && s.kind === "drawer"
      ? { ...s, drawerDefault: n, label: `Bloque de ${n} cajones` }
      : s,
  );
  return syncTemplateMeta({ ...template, sections });
}

export function builderInnerCm(outerWidthCm: number, outerHeightCm: number, thicknessMm: number) {
  const t = thicknessMm / 10;
  return {
    innerW: Math.max(outerWidthCm - 2 * t, 40),
    innerH: Math.max(outerHeightCm - 2 * t, 80),
  };
}

function fracFromCm(cm: number, inner: number, minFrac: number, maxFrac: number) {
  if (!(inner > 0)) return minFrac;
  const raw = cm / inner;
  return Math.min(maxFrac, Math.max(minFrac, Math.round(raw * 1e6) / 1e6));
}

/** Fondo típico si la pieza no tiene prefDepthCm. */
export function defaultPieceDepthCm(
  sec: TemplateSection,
  outerDepthCm: number,
  thicknessMm: number,
) {
  const tCm = thicknessMm / 10;
  const shelfDepth = Math.round(Math.max(outerDepthCm - tCm - 0.4, 25) * 10) / 10;
  if (sec.kind === "drawer") return Math.max(Math.round((shelfDepth - 2) * 10) / 10, 20);
  return shelfDepth;
}

/** Tamaño real aproximado de una zona (cm) según medidas exteriores. */
export function sectionSizeCm(
  sec: TemplateSection,
  outerWidthCm: number,
  outerHeightCm: number,
  thicknessMm: number,
  outerDepthCm?: number,
) {
  const { innerW, innerH } = builderInnerCm(outerWidthCm, outerHeightCm, thicknessMm);
  const depthCm =
    sec.prefDepthCm ??
    (outerDepthCm != null ? defaultPieceDepthCm(sec, outerDepthCm, thicknessMm) : undefined);
  return {
    widthCm: sec.prefWidthCm ?? Math.round(innerW * sec.fw * 10) / 10,
    heightCm: sec.prefHeightCm ?? Math.round(innerH * sec.fh * 10) / 10,
    depthCm,
  };
}

/** Fija ancho y/o alto de una pieza en cm (vista frontal del interior). */
export function setSectionSizeCm(
  template: ClosetTemplate,
  sectionId: string,
  size: { widthCm?: number; heightCm?: number },
  outerWidthCm: number,
  outerHeightCm: number,
  thicknessMm: number,
): ClosetTemplate | { error: string } {
  const others = template.sections.filter((s) => s.id !== sectionId);
  const target = template.sections.find((s) => s.id === sectionId);
  if (!target) return { error: "Pieza no encontrada" };
  const { innerW, innerH } = builderInnerCm(outerWidthCm, outerHeightCm, thicknessMm);
  const cur = sectionSizeCm(target, outerWidthCm, outerHeightCm, thicknessMm);
  const wCm = size.widthCm ?? cur.widthCm;
  const hCm = size.heightCm ?? cur.heightCm;
  if (!(wCm > 0 && hCm > 0)) return { error: "Ancho y alto deben ser mayores que cero." };

  const w = Math.round(wCm * 10) / 10;
  const h = Math.round(hCm * 10) / 10;
  const fw = fracFromCm(w, innerW, 0.08, 1 - target.fx);
  const fh = fracFromCm(h, innerH, 0.06, 1 - target.fy);
  if (fw < 0.08 || fh < 0.06) return { error: "La pieza quedaría demasiado pequeña." };
  if (target.fx + fw > 1 + 0.001 || target.fy + fh > 1 + 0.001) {
    return { error: "No cabe con ese tamaño donde está. Muévela o reduce medidas." };
  }

  const resized = { ...target, fw, fh, prefWidthCm: w, prefHeightCm: h };
  if (overlapsExisting(resized, others)) return { error: "Así choca con otra pieza." };
  const sections = template.sections.map((s) => (s.id === sectionId ? resized : s));
  return syncTemplateMeta({ ...template, sections });
}

export function setSectionDepthCm(
  template: ClosetTemplate,
  sectionId: string,
  depthCm: number,
  outerDepthCm: number,
): ClosetTemplate | { error: string } {
  if (!(depthCm > 0)) return { error: "El fondo debe ser mayor que cero." };
  if (depthCm > outerDepthCm) return { error: "El fondo no puede superar el fondo total del mueble." };
  const d = Math.round(depthCm * 10) / 10;
  const sections = template.sections.map((s) =>
    s.id === sectionId ? { ...s, prefDepthCm: d } : s,
  );
  return syncTemplateMeta({ ...template, sections });
}