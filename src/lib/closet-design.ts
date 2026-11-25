export type SectionKind =
  | "top"
  | "cubbie"
  | "hang"
  | "shelf"
  | "drawer"
  | "tall"
  | "footer"
  | "door"
  | "carcass"
  | "shelf-board"
  | "divider"
  | "rod"
  | "drawer-front";

export type PartCategory = "carcass" | "doors" | "interior" | "drawers" | "hardware";

export type TemplateSection = {
  id: string;
  label: string;
  hint: string;
  kind: SectionKind;
  /** Fracción del interior (sin marco) en vista frontal */
  fx: number;
  fy: number;
  fw: number;
  fh: number;
  parentSectionId?: string;
  boardIndex?: number;
  /** Cajones por defecto en esta zona (solo kind drawer). */
  drawerDefault?: number;
  /** Fondo deseado de esta zona en el armador (cm); se lleva a «Listo, medir». */
  prefDepthCm?: number;
  /** Ancho/alto en cm tal como los escribes (sin recortar por tableros ni rejilla). */
  prefWidthCm?: number;
  prefHeightCm?: number;
};

export type TemplateCategory = "closet" | "cocina" | "mueble" | "repisa";

export type ClosetTemplate = {
  id: string;
  category: TemplateCategory;
  name: string;
  description: string;
  doors: number;
  drawers: number;
  rails: number;
  /** Tabiques verticales interiores (referencia tipo CutNest / Plymap) */
  verticalDividers: number;
  sections: TemplateSection[];
};

export type LayoutBox = {
  id: string;
  label: string;
  kind: SectionKind;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type SectionMeasure = {
  widthCm: number;
  heightCm: number;
  /** Profundidad / fondo útil (cm) o espesor del tablero en piezas de contorno */
  depthCm: number;
  done: boolean;
  /** Cajones en esta zona (solo bloques tipo drawer). */
  drawerCount?: number;
};

export type VisualPlanPart = {
  id: string;
  label: string;
  widthMm: number;
  heightMm: number;
  depthMm?: number;
  qty: number;
  category: PartCategory;
  note?: string;
};

export type PartGroup = {
  id: PartCategory | "carcass";
  label: string;
  parts: VisualPlanPart[];
};

export type VisualPlan = {
  template: ClosetTemplate;
  materialName: string;
  outerWidthCm: number;
  outerHeightCm: number;
  outerDepthCm: number;
  sections: Record<string, SectionMeasure>;
  parts: VisualPlanPart[];
  partGroups: PartGroup[];
  supplies: { name: string; qty: number; unit: string }[];
  priceEstimateMxn: number;
  completedSteps: number;
  totalSteps: number;
  elevationSvg: string;
};

/**
 * Plantillas = rejilla interna en fracciones (fx,fy,fw,fh) del 0–1, definidas en código.
 * No vienen de un CAD; conviene validar que ninguna zona se solape (ver assertTemplateLayouts).
 */
/** Plantillas de ejemplo eliminadas: usar armador + diseños guardados (local / taller). */
export const CLOSET_TEMPLATES: ClosetTemplate[] = [];

export const TEMPLATE_CATEGORIES: { id: TemplateCategory; label: string }[] = [
  { id: "closet", label: "Clósets" },
  { id: "cocina", label: "Cocina" },
  { id: "mueble", label: "Muebles" },
  { id: "repisa", label: "Repisas y zapateros" },
];

export function formatCm(value: number | undefined | null): string {
  if (value == null || Number.isNaN(value)) return "—";
  return (Math.round(value * 10) / 10).toFixed(1);
}

export function roundCm(value: number): number {
  return Math.round(value * 10) / 10;
}

const DOOR_GAP_CM = 0.3;
const DOOR_INSET_CM = 0.2;
const DRAWER_GAP_CM = 0.35;
const DRAWER_VIEW_GAP_FRAC = 0.014;
const TOE_KICK_CM = 8;
const DOOR_NAME = ["izquierda", "central", "derecha", "4ª", "5ª"];

export function isDoorSectionId(id: string) {
  return id.startsWith("door-");
}

export function doorSectionIds(template: ClosetTemplate) {
  return Array.from({ length: template.doors }, (_, i) => `door-${i + 1}`);
}

function doorSectionDefs(template: ClosetTemplate): TemplateSection[] {
  return Array.from({ length: template.doors }, (_, i) => ({
    id: `door-${i + 1}`,
    label: template.doors === 1 ? "Puerta (frente)" : `Puerta ${DOOR_NAME[i] ?? i + 1}`,
    hint: "Vista frontal: ancho × alto. Fondo = espesor del tablero de puerta",
    kind: "door" as SectionKind,
    fx: 0,
    fy: 0,
    fw: 1,
    fh: 1,
  }));
}

/** Piezas del contorno (costados, tapa, base, fondo, zócalo). */
export function surroundSectionDefs(template: ClosetTemplate): TemplateSection[] {
  const items: TemplateSection[] = [
    {
      id: "struct-left",
      label: "Costado izquierdo",
      hint: "Vista al costado: fondo del mueble × altura total · espesor = tablero",
      kind: "carcass",
      fx: 0,
      fy: 0,
      fw: 0,
      fh: 0,
    },
    {
      id: "struct-right",
      label: "Costado derecho",
      hint: "Igual que costado izquierdo (par)",
      kind: "carcass",
      fx: 0,
      fy: 0,
      fw: 0,
      fh: 0,
    },
    {
      id: "struct-top",
      label: "Tapa superior",
      hint: "Tablero horizontal arriba: ancho interior × fondo · espesor = tablero",
      kind: "carcass",
      fx: 0,
      fy: 0,
      fw: 0,
      fh: 0,
    },
    {
      id: "struct-bottom",
      label: "Base inferior",
      hint: "Tablero horizontal abajo (suelo del mueble): ancho interior × fondo",
      kind: "carcass",
      fx: 0,
      fy: 0,
      fw: 0,
      fh: 0,
    },
    {
      id: "struct-back",
      label: "Respaldo / contrachapado",
      hint: "No se ve en vista frontal · ancho × alto del respaldo · espesor 6–8 mm",
      kind: "carcass",
      fx: 0,
      fy: 0,
      fw: 0,
      fh: 0,
    },
    {
      id: "struct-toe",
      label: "Zócalo frontal",
      hint: "Franja inferior al frente · ancho interior · alto ~8 cm",
      kind: "carcass",
      fx: 0,
      fy: 0,
      fw: 0,
      fh: 0,
    },
  ];
  return items;
}

/** Costados, tapa, base y zócalo con posición en la vista frontal. */
export function carcassFrameLayoutBoxes(
  template: ClosetTemplate,
  outerWidthCm: number,
  outerHeightCm: number,
): LayoutBox[] {
  const layout = getLayoutGeometry(template, outerWidthCm, outerHeightCm);
  const { ox, oy, rw, rh, frame, innerW } = layout;
  const toeH = template.category === "closet" || template.category === "cocina" ? Math.min(frame * 1.5, 20) : 0;
  const boxes: LayoutBox[] = [
    {
      id: "struct-left",
      label: "Costado izquierdo",
      kind: "carcass",
      x: ox,
      y: oy,
      w: frame,
      h: rh,
    },
    {
      id: "struct-right",
      label: "Costado derecho",
      kind: "carcass",
      x: ox + rw - frame,
      y: oy,
      w: frame,
      h: rh,
    },
    {
      id: "struct-top",
      label: "Tapa superior",
      kind: "carcass",
      x: ox,
      y: oy,
      w: rw,
      h: frame,
    },
    {
      id: "struct-bottom",
      label: "Base inferior",
      kind: "carcass",
      x: ox + frame,
      y: oy + rh - frame - toeH,
      w: innerW,
      h: frame,
    },
  ];
  if (toeH > 0) {
    boxes.push({
      id: "struct-toe",
      label: "Zócalo frontal",
      kind: "carcass",
      x: ox + frame,
      y: oy + rh - toeH,
      w: innerW,
      h: toeH,
    });
  }
  return boxes;
}

export function carcassFaceSectionDefs(template: ClosetTemplate): TemplateSection[] {
  return surroundSectionDefs(template).filter((s) => s.id !== "struct-back");
}

export function clampMeasureRatio(value: number, min = 0.45, max = 1): number {
  if (!Number.isFinite(value) || value <= 0) return 1;
  return Math.min(max, Math.max(min, value));
}

/** Ajusta el rectángulo en pantalla según medidas escitas vs referencia del diseño. */
export function scaleLayoutBoxToMeasure(
  box: LayoutBox,
  measure: SectionMeasure,
  reference?: SectionMeasure,
): LayoutBox {
  if (!reference || reference.widthCm < 1 || reference.heightCm < 1) return box;
  const sw = clampMeasureRatio(measure.widthCm / reference.widthCm, 0.15, 1);
  const sh = clampMeasureRatio(measure.heightCm / reference.heightCm, 0.15, 1);
  const w = box.w * sw;
  const h = box.h * sh;
  return {
    ...box,
    x: box.x + (box.w - w) / 2,
    y: box.y + (box.h - h) / 2,
    w,
    h,
  };
}

export function depthBarWidth(boxW: number, depthCm: number, referenceDepthCm: number): number {
  const ratio = clampMeasureRatio(depthCm / Math.max(referenceDepthCm, 1), 0.2, 1);
  return boxW * 0.92 * ratio;
}

export function shortPlanLabel(label: string): string {
  const dash = label.indexOf(" — ");
  let text = dash > 0 ? label.slice(dash + 3).trim() : label;
  text = text
    .replace(/\bsuperior\b/gi, "sup.")
    .replace(/\binferior\b/gi, "inf.")
    .replace(/\bderecha\b/gi, "der.")
    .replace(/\bizquierda\b/gi, "izq.")
    .replace(/\bcentro\b/gi, "cto.")
    .replace(/\bcentral(es)?\b/gi, "cto.")
    .replace(/\bcompartimento\b/gi, "comp.")
    .replace(/\bCubículos\b/g, "Cubículos");
  if (text.length > 32) return `${text.slice(0, 30)}…`;
  return text;
}

/** Grosor visible de una tabla en vista frontal (solo dibujo; no es la medida real). */
const SHELF_BOARD_VIEW_THICKNESS = 0.012;
const HANG_ROD_VIEW_THICKNESS = 0.01;
const DIVIDER_VIEW_THICKNESS = 0.01;
/** Margen lateral para que la tabla quede “dentro” del compartimento. */
const SHELF_INSET_FRAC = 0.06;

function roundFrac(x: number) {
  return Math.round(x * 1000) / 1000;
}

/** Límites verticales compartidos entre dos zonas (donde va un tabique). */
export function interiorVerticalDividerPositions(template: ClosetTemplate): number[] {
  const counts = new Map<number, number>();
  for (const s of template.sections) {
    for (const x of [s.fx, s.fx + s.fw]) {
      const k = roundFrac(x);
      if (k <= 0.02 || k >= 0.98) continue;
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
  }
  const shared = [...counts.entries()]
    .filter(([, c]) => c >= 2)
    .map(([x]) => x)
    .sort((a, b) => a - b);
  const n = template.verticalDividers;
  if (n <= 0) return [];
  if (shared.length >= n) return shared.slice(0, n);
  if (shared.length > 0) return shared;
  return Array.from({ length: n }, (_, i) => (i + 1) / (n + 1));
}

function shelfBoardCount(kind: SectionKind, sectionId: string): number {
  if (kind === "cubbie") return 4;
  if (kind === "top") return 1;
  if (kind === "shelf") {
    if (sectionId.includes("center")) return 3;
    if (sectionId.startsWith("n") || sectionId.startsWith("s")) return 1;
    return 2;
  }
  return 1;
}

/** Línea horizontal de la tabla (vista frontal): ancho del hueco, franja delgada. */
export function shelfBoardViewFractions(
  parent: TemplateSection,
  boardIndex: number,
  boardCount: number,
): { fx: number; fy: number; fw: number; fh: number } {
  const t = boardIndex / (boardCount + 1);
  const strip = SHELF_BOARD_VIEW_THICKNESS;
  const inset = parent.fw * SHELF_INSET_FRAC;
  return {
    fx: parent.fx + inset,
    fw: Math.max(parent.fw - inset * 2, parent.fw * 0.5),
    fy: parent.fy + parent.fh * t - strip / 2,
    fh: strip,
  };
}

/** Cada tabla de repisa (tablero horizontal) por separado: largo × profundidad × espesor. */
export function shelfBoardSectionDefs(template: ClosetTemplate): TemplateSection[] {
  const out: TemplateSection[] = [];
  for (const s of template.sections) {
    if (!["shelf", "top", "cubbie"].includes(s.kind)) continue;
    const n = shelfBoardCount(s.kind, s.id);
    for (let i = 1; i <= n; i++) {
      const g = shelfBoardViewFractions(s, i, n);
      out.push({
        id: `${s.id}-board-${i}`,
        parentSectionId: s.id,
        boardIndex: i,
        label: `${s.label} — tabla ${i}`,
        hint: "Largo (ancho en planta) · Espesor del tablero · Profundidad (fondo)",
        kind: "shelf-board",
        fx: g.fx,
        fy: g.fy,
        fw: g.fw,
        fh: g.fh,
      });
    }
  }
  return out;
}

/** Compartimentos que contienen tablas (guía punteada en el dibujo). */
export function shelfParentSectionDefs(template: ClosetTemplate): TemplateSection[] {
  return template.sections.filter((s) => ["shelf", "top", "cubbie"].includes(s.kind));
}

/** Tabiques verticales (paneles de división), uno por cada partición interior. */
export function interiorDividerSectionDefs(template: ClosetTemplate): TemplateSection[] {
  const positions = interiorVerticalDividerPositions(template);
  const strip = DIVIDER_VIEW_THICKNESS;
  return positions.map((x, i) => ({
    id: `divider-${i + 1}`,
    label: `Tabique vertical ${i + 1}`,
    hint: "Panel vertical entre compartimentos: ancho = fondo carcasa · alto = interior · espesor = espesor tablero",
    kind: "divider",
    fx: x - strip / 2,
    fy: 0,
    fw: strip,
    fh: 1,
  }));
}

export function isShelfBoardSectionId(id: string) {
  return id.includes("-board-");
}

export function isInteriorDividerId(id: string) {
  return id.startsWith("divider-");
}

/** Solo lo que se ve en el dibujo (zonas + puertas). Repisas y divisiones van en listas aparte. */
export function drawingSectionDefs(template: ClosetTemplate): TemplateSection[] {
  return [...template.sections, ...doorSectionDefs(template)];
}

export type CompartmentGroup = {
  compartmentId: string;
  compartmentLabel: string;
  shelfBoards: TemplateSection[];
};

export function shelfBoardsByCompartment(template: ClosetTemplate): CompartmentGroup[] {
  const boards = shelfBoardSectionDefs(template);
  return template.sections
    .filter((s) => ["shelf", "top", "cubbie"].includes(s.kind))
    .map((s) => ({
      compartmentId: s.id,
      compartmentLabel: s.label,
      shelfBoards: boards.filter((b) => b.parentSectionId === s.id),
    }))
    .filter((g) => g.shelfBoards.length > 0);
}

/** Tubo/riel por cada zona de colgar (medición aparte del hueco). */
export function hangRodSectionDefs(template: ClosetTemplate): TemplateSection[] {
  return template.sections
    .filter((s) => s.kind === "hang")
    .map((s) => {
      const strip = HANG_ROD_VIEW_THICKNESS;
      const inset = s.fw * SHELF_INSET_FRAC;
      const rodY = s.fy + s.fh * 0.22;
      return {
        id: `${s.id}-rod`,
        parentSectionId: s.id,
        label: `${s.label} — tubo riel`,
        hint: "Largo del tubo · Diámetro (≈2.5 cm) · Altura del centro respecto al piso del mueble",
        kind: "rod" as SectionKind,
        fx: s.fx + inset,
        fy: rodY - strip / 2,
        fw: Math.max(s.fw - inset * 2, s.fw * 0.5),
        fh: strip,
      };
    });
}

export function isHangRodSectionId(id: string) {
  return id.endsWith("-rod") && !id.startsWith("door-");
}

export function isDrawerFrontSectionId(id: string) {
  return id.includes("-front-") && !id.startsWith("door-");
}

export function defaultDrawerCountForSection(sec: TemplateSection, template: ClosetTemplate): number {
  if (sec.drawerDefault != null) return sec.drawerDefault;
  const blocks = template.sections.filter((s) => s.kind === "drawer");
  if (blocks.length === 0) return 1;
  return Math.max(1, Math.round(template.drawers / blocks.length));
}

export function drawerCountForBlock(
  parent: TemplateSection,
  template: ClosetTemplate,
  sections: Record<string, SectionMeasure>,
): number {
  const raw = sections[parent.id]?.drawerCount ?? defaultDrawerCountForSection(parent, template);
  return Math.max(1, Math.min(8, raw));
}

export function drawerHeightCm(blockMeasure: SectionMeasure, count: number): number {
  const n = Math.max(1, count);
  return roundCm((blockMeasure.heightCm - DRAWER_GAP_CM * (n + 1)) / n);
}

/** Frentes de cajón con posición en el dibujo (según cuántos cajones eligió el usuario). */
export function drawerFrontSectionDefs(
  template: ClosetTemplate,
  sections: Record<string, SectionMeasure>,
): TemplateSection[] {
  const out: TemplateSection[] = [];
  for (const parent of template.sections.filter((s) => s.kind === "drawer")) {
    const n = drawerCountForBlock(parent, template, sections);
    const gap = DRAWER_VIEW_GAP_FRAC;
    const slotH = (parent.fh - gap * (n + 1)) / n;
    for (let i = 0; i < n; i++) {
      out.push({
        id: `${parent.id}-front-${i + 1}`,
        parentSectionId: parent.id,
        boardIndex: i + 1,
        label: `${parent.label} — cajón ${i + 1}`,
        hint: "Frente: ancho × alto calculado · espesor = tablero",
        kind: "drawer-front",
        fx: parent.fx,
        fy: parent.fy + gap + i * (slotH + gap),
        fw: parent.fw,
        fh: slotH,
      });
    }
  }
  return out;
}

export function syncDrawerFrontMeasures(
  template: ClosetTemplate,
  outerWidthCm: number,
  outerHeightCm: number,
  thicknessMm: number,
  out: Record<string, SectionMeasure>,
) {
  const frame = 3.6;
  const innerW = Math.max(outerWidthCm - frame * 2, 40);
  const innerH = Math.max(outerHeightCm - frame * 2, 80);
  const tCm = thicknessMm / 10;
  for (const parent of template.sections.filter((s) => s.kind === "drawer")) {
    const n = drawerCountForBlock(parent, template, out);
    const pw = roundCm(innerW * parent.fw);
    const ph = roundCm(innerH * parent.fh);
    out[parent.id] = {
      ...out[parent.id],
      widthCm: pw,
      heightCm: ph,
      depthCm: out[parent.id]?.depthCm ?? Math.max(outerWidthCm - 30, 25),
      done: out[parent.id]?.done ?? false,
      drawerCount: n,
    };
    const eachH = drawerHeightCm(out[parent.id], n);
    for (const f of drawerFrontSectionDefs(template, out)) {
      if (f.parentSectionId !== parent.id) continue;
      out[f.id] = {
        widthCm: pw,
        heightCm: eachH,
        depthCm: tCm,
        done: out[f.id]?.done ?? false,
      };
    }
  }
}

export function drawerSectionDefs(template: ClosetTemplate): TemplateSection[] {
  return template.sections.filter((s) => s.kind === "drawer");
}

export function resyncAllDrawerFronts(
  template: ClosetTemplate,
  outerWidthCm: number,
  outerHeightCm: number,
  thicknessMm: number,
  sections: Record<string, SectionMeasure>,
): Record<string, SectionMeasure> {
  const next = { ...sections };
  const validIds = new Set(drawerFrontSectionDefs(template, next).map((s) => s.id));
  for (const key of Object.keys(next)) {
    if (isDrawerFrontSectionId(key) && !validIds.has(key)) delete next[key];
  }
  syncDrawerFrontMeasures(template, outerWidthCm, outerHeightCm, thicknessMm, next);
  return next;
}

function sectionToLayoutBox(
  sec: TemplateSection,
  ox: number,
  oy: number,
  frame: number,
  innerW: number,
  innerH: number,
): LayoutBox {
  return {
    id: sec.id,
    label: sec.label,
    kind: sec.kind,
    x: ox + frame + sec.fx * innerW,
    y: oy + frame + sec.fy * innerH,
    w: sec.fw * innerW,
    h: sec.fh * innerH,
  };
}

export function shelfParentLayoutBoxes(
  template: ClosetTemplate,
  outerWidthCm: number,
  outerHeightCm: number,
): LayoutBox[] {
  const layout = getLayoutGeometry(template, outerWidthCm, outerHeightCm);
  const { ox, oy, frame, innerW, innerH } = layout;
  return shelfParentSectionDefs(template).map((s) => sectionToLayoutBox(s, ox, oy, frame, innerW, innerH));
}

/** Posiciones en el dibujo para tablas de repisa y tubos. */
export function accessoryLayoutBoxes(
  template: ClosetTemplate,
  outerWidthCm: number,
  outerHeightCm: number,
): LayoutBox[] {
  const layout = getLayoutGeometry(template, outerWidthCm, outerHeightCm);
  const { ox, oy, frame, innerW, innerH } = layout;
  return [
    ...carcassFrameLayoutBoxes(template, outerWidthCm, outerHeightCm),
    ...interiorDividerSectionDefs(template).map((s) => sectionToLayoutBox(s, ox, oy, frame, innerW, innerH)),
    ...shelfBoardSectionDefs(template).map((s) => sectionToLayoutBox(s, ox, oy, frame, innerW, innerH)),
    ...hangRodSectionDefs(template).map((s) => sectionToLayoutBox(s, ox, oy, frame, innerW, innerH)),
  ];
}

/** Tablas, contorno, tabiques y tubos — lista de corte interior visible. */
export function shelvesAndRodsSectionDefs(template: ClosetTemplate): TemplateSection[] {
  return [
    ...carcassFaceSectionDefs(template),
    ...shelfBoardSectionDefs(template),
    ...interiorDividerSectionDefs(template),
    ...hangRodSectionDefs(template),
  ];
}

/** Todas las secciones medibles (dibujo + repisas/tubos + cajones + divisiones + contorno). */
export function allSectionDefs(
  template: ClosetTemplate,
  sections: Record<string, SectionMeasure> = {},
): TemplateSection[] {
  return [
    ...drawingSectionDefs(template),
    ...shelfBoardSectionDefs(template),
    ...hangRodSectionDefs(template),
    ...drawerFrontSectionDefs(template, sections),
    ...interiorDividerSectionDefs(template),
    ...surroundSectionDefs(template),
  ];
}

export function isSurroundSectionId(id: string) {
  return id.startsWith("struct-");
}

function doorMeasureCm(template: ClosetTemplate, outerWidthCm: number, outerHeightCm: number, index: number) {
  const n = template.doors;
  if (n === 0) return { widthCm: 0, heightCm: 0 };
  const w = (outerWidthCm - DOOR_GAP_CM * (n + 1)) / n;
  const h = outerHeightCm - DOOR_INSET_CM * 2;
  return { widthCm: roundCm(w), heightCm: roundCm(h), index };
}

function getDoorLayoutBoxes(
  template: ClosetTemplate,
  ox: number,
  oy: number,
  rw: number,
  rh: number,
  outerWidthCm: number,
): LayoutBox[] {
  const n = template.doors;
  if (n === 0) return [];
  const scale = rw / outerWidthCm;
  const gap = DOOR_GAP_CM * scale;
  const totalGap = gap * (n + 1);
  const dw = (rw - totalGap) / n;
  return Array.from({ length: n }, (_, i) => ({
    id: `door-${i + 1}`,
    label: template.doors === 1 ? "Puerta (frente)" : `Puerta ${DOOR_NAME[i] ?? i + 1}`,
    kind: "door" as SectionKind,
    x: ox + gap + i * (dw + gap),
    y: oy,
    w: dw,
    h: rh,
  }));
}

function measureToPart(
  id: string,
  label: string,
  m: SectionMeasure,
  qty: number,
  note?: string,
): VisualPlanPart {
  return {
    id,
    label,
    widthMm: Math.round(m.widthCm * 10),
    heightMm: Math.round(m.heightCm * 10),
    depthMm: Math.round(m.depthCm * 10),
    qty,
    category: "carcass",
    note,
  };
}

function buildCarcassParts(input: {
  template: ClosetTemplate;
  outerWidthCm: number;
  outerHeightCm: number;
  outerDepthCm: number;
  thicknessMm: number;
  sections?: Record<string, SectionMeasure>;
}): VisualPlanPart[] {
  const t = input.thicknessMm;
  const tCm = t / 10;
  const carcassDepth = Math.max(input.outerDepthCm - 2, 30);
  const innerW = Math.max(input.outerWidthCm - 2 * tCm, 40);
  const innerH = Math.max(input.outerHeightCm - 2 * tCm, 80);
  const s = input.sections ?? {};
  const use = (id: string, fallback: SectionMeasure) => s[id] ?? fallback;

  const sideFb: SectionMeasure = {
    widthCm: carcassDepth,
    heightCm: input.outerHeightCm,
    depthCm: tCm,
    done: false,
  };
  const topFb: SectionMeasure = { widthCm: innerW, heightCm: carcassDepth, depthCm: tCm, done: false };
  const backFb: SectionMeasure = {
    widthCm: input.outerWidthCm - 0.8,
    heightCm: input.outerHeightCm - 0.8,
    depthCm: 0.6,
    done: false,
  };
  const toeFb: SectionMeasure = { widthCm: innerW, heightCm: TOE_KICK_CM, depthCm: 2, done: false };
  const divFb: SectionMeasure = { widthCm: carcassDepth, heightCm: innerH, depthCm: tCm, done: false };

  const topMeasure = use("struct-top", topFb);
  const sideMeasure = use("struct-left", sideFb);
  const parts: VisualPlanPart[] = [
    measureToPart("carcass-left", "Costado izquierdo", sideMeasure, 1),
    measureToPart("carcass-right", "Costado derecho", use("struct-right", sideFb), 1),
    measureToPart("carcass-top", "Tapa superior", topMeasure, 1),
    measureToPart("carcass-bottom", "Base inferior", use("struct-bottom", topFb), 1),
    measureToPart("carcass-back", "Tablero de fondo (contrachapado)", use("struct-back", backFb), 1, "Opcional contra muro"),
  ];
  const dividerMeasures = interiorDividerSectionDefs(input.template)
    .map((d) => input.sections?.[d.id])
    .filter((m): m is SectionMeasure => Boolean(m));
  if (dividerMeasures.length > 0) {
    dividerMeasures.forEach((m, i) => {
      parts.push(measureToPart(`carcass-divider-${i + 1}`, `División vertical ${i + 1}`, m, 1));
    });
  } else if (input.template.verticalDividers > 0) {
    parts.push(
      measureToPart(
        "carcass-dividers",
        "Tabiques / particiones verticales",
        divFb,
        input.template.verticalDividers,
        "Medir cada división en la tabla",
      ),
    );
  }
  if (input.template.category === "closet" || input.template.category === "cocina") {
    parts.push(measureToPart("carcass-toe", "Zócalo frontal", use("struct-toe", toeFb), 1));
  }
  return parts;
}

function groupParts(parts: VisualPlanPart[]): PartGroup[] {
  const defs: { id: PartGroup["id"]; label: string }[] = [
    { id: "carcass", label: "Carcasa, fondo y zócalo" },
    { id: "doors", label: "Puertas y frentes" },
    { id: "interior", label: "Interiores (repisas y compartimentos)" },
    { id: "drawers", label: "Cajones (frentes y cajas)" },
    { id: "hardware", label: "Tubos y herrajes" },
  ];
  return defs
    .map((d) => ({
      id: d.id,
      label: d.label,
      parts: parts.filter((p) => p.category === d.id),
    }))
    .filter((g) => g.parts.length > 0);
}

function hingesPerDoor(heightCm: number) {
  if (heightCm > 200) return 4;
  if (heightCm > 150) return 3;
  return 2;
}

/** Exterior vs interior útil (lo que reparten las zonas del dibujo). */
export function cabinDimensionSummary(
  outerWidthCm: number,
  outerHeightCm: number,
  thicknessMm: number,
) {
  const tCm = thicknessMm / 10;
  const innerW = roundCm(Math.max(outerWidthCm - 2 * tCm, 40));
  const innerH = roundCm(Math.max(outerHeightCm - 2 * tCm, 80));
  return {
    outerWidthCm,
    outerHeightCm,
    innerWidthCm: innerW,
    innerHeightCm: innerH,
    sidePanelCm: tCm,
    toeKickCm: TOE_KICK_CM,
    doorGapCm: DOOR_GAP_CM,
  };
}

export function getLayoutGeometry(template: ClosetTemplate, outerWidthCm: number, outerHeightCm: number) {
  const pad = 56;
  const maxW = 720;
  const scale = maxW / outerWidthCm;
  const rw = outerWidthCm * scale;
  const rh = outerHeightCm * scale;
  const frame = 3.6 * scale;
  const ox = pad;
  const oy = pad;
  const innerW = rw - frame * 2;
  const innerH = rh - frame * 2;

  const innerBoxes: LayoutBox[] = template.sections.map((sec) => ({
    id: sec.id,
    label: sec.label,
    kind: sec.kind,
    x: ox + frame + sec.fx * innerW,
    y: oy + frame + sec.fy * innerH,
    w: sec.fw * innerW,
    h: sec.fh * innerH,
  }));

  const doorBoxes = getDoorLayoutBoxes(template, ox, oy, rw, rh, outerWidthCm);
  const boxes = [...innerBoxes, ...doorBoxes];

  return {
    viewW: rw + pad * 2,
    viewH: rh + pad * 2 + 36,
    ox,
    oy,
    rw,
    rh,
    frame,
    innerW,
    innerH,
    innerBoxes,
    doorBoxes,
    boxes,
  };
}

export function defaultSectionMeasures(
  template: ClosetTemplate,
  outerWidthCm: number,
  outerHeightCm: number,
  outerDepthCm: number,
  thicknessMm: number,
): Record<string, SectionMeasure> {
  const frame = 3.6;
  const tCm = thicknessMm / 10;
  const innerW = Math.max(outerWidthCm - frame * 2, 40);
  const innerH = Math.max(outerHeightCm - frame * 2, 80);
  const carcassDepth = Math.max(outerDepthCm - 2, 30);
  const shelfDepth = roundCm(Math.max(outerDepthCm - tCm - 0.4, 25));
  const out: Record<string, SectionMeasure> = {};
  const baseDefs = [
    ...drawingSectionDefs(template),
    ...shelfBoardSectionDefs(template),
    ...hangRodSectionDefs(template),
    ...interiorDividerSectionDefs(template),
    ...surroundSectionDefs(template),
  ];
  for (const s of baseDefs) {
    if (s.kind === "door") {
      const idx = Number(s.id.replace("door-", "")) - 1;
      const dm = doorMeasureCm(template, outerWidthCm, outerHeightCm, idx);
      out[s.id] = { widthCm: dm.widthCm, heightCm: dm.heightCm, depthCm: tCm, done: false };
    } else if (s.kind === "carcass") {
      if (s.id === "struct-left" || s.id === "struct-right") {
        out[s.id] = { widthCm: carcassDepth, heightCm: outerHeightCm, depthCm: tCm, done: false };
      } else if (s.id === "struct-top" || s.id === "struct-bottom") {
        out[s.id] = {
          widthCm: Math.round((outerWidthCm - 2 * tCm) * 10) / 10,
          heightCm: carcassDepth,
          depthCm: tCm,
          done: false,
        };
      } else if (s.id === "struct-back") {
        out[s.id] = {
          widthCm: Math.round((outerWidthCm - 0.8) * 10) / 10,
          heightCm: Math.round((outerHeightCm - 0.8) * 10) / 10,
          depthCm: 0.6,
          done: false,
        };
      } else if (s.id === "struct-toe") {
        out[s.id] = {
          widthCm: Math.round((outerWidthCm - 2 * tCm) * 10) / 10,
          heightCm: TOE_KICK_CM,
          depthCm: 2,
          done: false,
        };
      }
    } else if (s.kind === "shelf-board" && s.parentSectionId) {
      const parent = template.sections.find((p) => p.id === s.parentSectionId);
      const pw = parent ? innerW * parent.fw : innerW * s.fw;
      out[s.id] = {
        widthCm: Math.round(pw * 10) / 10,
        heightCm: tCm,
        depthCm: shelfDepth,
        done: false,
      };
    } else if (s.kind === "divider") {
      out[s.id] = {
        widthCm: carcassDepth,
        heightCm: Math.round((outerHeightCm - 2 * tCm) * 10) / 10,
        depthCm: tCm,
        done: false,
      };
    } else if (s.kind === "rod" && s.parentSectionId) {
      const parent = template.sections.find((p) => p.id === s.parentSectionId);
      const pw = parent ? innerW * parent.fw : innerW * s.fw;
      const rodCenterFromBottom =
        parent != null
          ? Math.round((innerH * (1 - (parent.fy + parent.fh * 0.22))) * 10) / 10
          : Math.round(innerH * 0.6 * 10) / 10;
      out[s.id] = {
        widthCm: Math.round(pw * 10) / 10,
        heightCm: 2.5,
        depthCm: rodCenterFromBottom,
        done: false,
      };
    } else if (s.kind === "drawer") {
      const n = defaultDrawerCountForSection(s, template);
      const zone = template.sections.find((ts) => ts.id === s.id);
      out[s.id] = {
        widthCm: zone?.prefWidthCm ?? roundCm(innerW * s.fw),
        heightCm: zone?.prefHeightCm ?? roundCm(innerH * s.fh),
        depthCm: zone?.prefDepthCm ?? Math.max(shelfDepth - 2, 20),
        done: false,
        drawerCount: n,
      };
    } else {
      const zone = template.sections.find((ts) => ts.id === s.id);
      out[s.id] = {
        widthCm: zone?.prefWidthCm ?? Math.round(innerW * s.fw * 10) / 10,
        heightCm: zone?.prefHeightCm ?? Math.round(innerH * s.fh * 10) / 10,
        depthCm: zone?.prefDepthCm ?? shelfDepth,
        done: false,
      };
    }
  }
  syncDrawerFrontMeasures(template, outerWidthCm, outerHeightCm, thicknessMm, out);
  return out;
}

function partsForSection(
  sec: TemplateSection,
  measure: SectionMeasure,
  fallbackDepthCm: number,
  thicknessMm: number,
): VisualPlanPart[] {
  const w = Math.round(measure.widthCm * 10);
  const h = Math.round(measure.heightCm * 10);
  const depthCm = measure.depthCm ?? fallbackDepthCm;
  const d = Math.round(depthCm * 10);
  const parts: VisualPlanPart[] = [];

  if (sec.kind === "shelf-board") {
    parts.push({
      id: `${sec.id}-plank`,
      label: sec.label,
      widthMm: w,
      heightMm: Math.round(depthCm * 10),
      depthMm: Math.round(measure.heightCm * 10),
      qty: 1,
      category: "interior",
      note: `Tabla: ${measure.widthCm}×${depthCm} cm · espesor ${measure.heightCm} cm`,
    });
    return parts;
  }

  if (sec.kind === "divider") {
    parts.push({
      id: `${sec.id}-panel`,
      label: sec.label,
      widthMm: w,
      heightMm: h,
      depthMm: d,
      qty: 1,
      category: "interior",
      note: "Tabique vertical interior",
    });
    return parts;
  }

  if (sec.kind === "rod") {
    parts.push({
      id: sec.id,
      label: sec.label,
      widthMm: w,
      heightMm: Math.round(measure.heightCm * 10),
      depthMm: d,
      qty: 1,
      category: "hardware",
      note: `Tubo riel Ø${formatCm(measure.heightCm)} cm · centro a ${formatCm(depthCm)} cm del piso`,
    });
    return parts;
  }

  if (sec.kind === "carcass") {
    const qty = sec.id === "struct-divider" ? 1 : 1;
    parts.push({
      id: `${sec.id}-panel`,
      label: sec.label,
      widthMm: w,
      heightMm: h,
      depthMm: d,
      qty,
      category: "carcass",
      note: "Ver también tabla Carcasa",
    });
    return parts;
  }

  if (sec.kind === "door") {
    parts.push({
      id: `${sec.id}-leaf`,
      label: sec.label,
      widthMm: w,
      heightMm: h,
      depthMm: d,
      qty: 1,
      category: "doors",
      note: "Bisagras ocultas Ø35 mm · canto en 4 lados",
    });
    return parts;
  }

  if (sec.kind === "drawer") {
    return [];
  }

  if (sec.kind === "drawer-front") {
    const boxH = Math.max(Math.round(measure.heightCm * 10) - 30, 80);
    parts.push({
      id: `${sec.id}-front`,
      label: sec.label,
      widthMm: w,
      heightMm: h,
      depthMm: d,
      qty: 1,
      category: "drawers",
      note: "Frente de cajón",
    });
    parts.push({
      id: `${sec.id}-box-side`,
      label: `Costados · ${sec.label}`,
      widthMm: Math.round((measure.depthCm ?? fallbackDepthCm) * 10),
      heightMm: boxH,
      qty: 2,
      category: "drawers",
    });
    parts.push({
      id: `${sec.id}-box-bottom`,
      label: `Fondo · ${sec.label}`,
      widthMm: Math.max(w - 40, 100),
      heightMm: Math.max(Math.round((measure.depthCm ?? fallbackDepthCm) * 10) - 15, 50),
      qty: 1,
      category: "drawers",
      note: "4–6 mm",
    });
    return parts;
  }

  if (sec.kind === "hang") {
    parts.push({
      id: `${sec.id}-panel`,
      label: `Panel lateral colgador (${sec.label})`,
      widthMm: w,
      heightMm: h,
      qty: 1,
      category: "interior",
      note: "Incluye zona de colgador",
    });
    parts.push({
      id: `${sec.id}-shelf`,
      label: `Repisa bajo colgador`,
      widthMm: w,
      heightMm: d,
      qty: 1,
      category: "interior",
    });
    return parts;
  }

  if (sec.kind === "footer") {
    parts.push({
      id: `${sec.id}-kick`,
      label: "Frente de zócalo (medida útil)",
      widthMm: w,
      heightMm: h,
      qty: 1,
      category: "carcass",
    });
    return parts;
  }

  parts.push({
    id: `${sec.id}-comp`,
    label: `${sec.label} (hueco)`,
    widthMm: w,
    heightMm: h,
    depthMm: d,
    qty: 1,
    category: "interior",
    note: `Compartimento · fondo útil ${depthCm} cm — repisas en tabla aparte`,
  });
  return parts;
}

export function buildVisualPlan(input: {
  template: ClosetTemplate;
  materialName: string;
  thicknessMm: number;
  pricePerLinearMeter: number;
  outerWidthCm: number;
  outerHeightCm: number;
  outerDepthCm: number;
  sections: Record<string, SectionMeasure>;
  activeSectionId?: string;
  showDoors?: boolean;
}): VisualPlan | null {
  const template = input.template;

  const parts: VisualPlanPart[] = buildCarcassParts({
    template,
    outerWidthCm: input.outerWidthCm,
    outerHeightCm: input.outerHeightCm,
    outerDepthCm: input.outerDepthCm,
    thicknessMm: input.thicknessMm,
    sections: input.sections,
  });

  for (const sec of allSectionDefs(template, input.sections)) {
    if (sec.kind === "carcass" || sec.kind === "drawer") continue;
    const measure = input.sections[sec.id];
    if (!measure) continue;
    parts.push(...partsForSection(sec, measure, input.outerDepthCm, input.thicknessMm));
  }

  const doorHinges = doorSectionIds(template).reduce((sum, id) => {
    const h = input.sections[id]?.heightCm ?? input.outerHeightCm;
    return sum + hingesPerDoor(h);
  }, 0);

  const supplies = [
    { name: "Bisagra copa 35 mm (puerta)", qty: doorHinges, unit: "pzas" },
    { name: "Riel de colgador + soportes", qty: template.rails, unit: "juego" },
    {
      name: "Tubo riel Ø25 mm",
      qty: Math.max(template.rails, hangRodSectionDefs(template).length),
      unit: "pieza",
    },
    {
      name: "Corredera cajón (par)",
      qty: drawerFrontSectionDefs(template, input.sections).length,
      unit: "par",
    },
    { name: "Jaladera / tirador", qty: template.drawers + template.doors, unit: "pzas" },
    { name: "Confirmat / tornillo ensamble", qty: Math.max(32, template.sections.length * 4), unit: "pzas" },
    {
      name: "Tapón repisa 5 mm",
      qty: shelfBoardSectionDefs(template).length * 4,
      unit: "pzas",
    },
    {
      name: "Canto melamina (aprox.)",
      qty: Math.round(
        (input.outerWidthCm * 2 + input.outerHeightCm * 2 + template.doors * input.outerHeightCm) / 2.5,
      ),
      unit: "m",
    },
  ].filter((s) => s.qty > 0);

  const partGroups = groupParts(parts);

  const measurable = allSectionDefs(template, input.sections);
  const completedSteps = measurable.filter((s) => input.sections[s.id]?.done).length;
  const priceEstimateMxn = Math.round((input.outerWidthCm / 100) * input.pricePerLinearMeter * 1.15);

  const elevationSvg = renderElevation({
    template,
    outerWidthCm: input.outerWidthCm,
    outerHeightCm: input.outerHeightCm,
    sections: input.sections,
    activeSectionId: input.activeSectionId,
    showDoors: input.showDoors ?? true,
  });

  return {
    template,
    materialName: input.materialName,
    outerWidthCm: input.outerWidthCm,
    outerHeightCm: input.outerHeightCm,
    outerDepthCm: input.outerDepthCm,
    sections: input.sections,
    parts,
    partGroups,
    supplies,
    priceEstimateMxn,
    completedSteps,
    totalSteps: measurable.length,
    elevationSvg,
  };
}

function renderElevation(opts: {
  template: ClosetTemplate;
  outerWidthCm: number;
  outerHeightCm: number;
  sections: Record<string, SectionMeasure>;
  activeSectionId?: string;
  showDoors?: boolean;
}) {
  const layout = getLayoutGeometry(opts.template, opts.outerWidthCm, opts.outerHeightCm);
  const showDoors = opts.showDoors ?? true;

  const fills: Record<SectionKind, string> = {
    top: "#ebe4da",
    cubbie: "#f5efe8",
    hang: "#e8ddd0",
    shelf: "#efe8df",
    drawer: "#d9c9b4",
    "drawer-front": "#e0cdb0",
    tall: "#e2d6c8",
    footer: "#c8b49a",
    door: "#c4a882",
    carcass: "#d8ccb8",
    "shelf-board": "#d4c4a8",
    divider: "#b8a090",
    rod: "#6a4c34",
  };

  let rects = "";
  let labels = "";

  const drawBox = (box: LayoutBox, layer: "inner" | "door" | "shelf" | "divider") => {
    const m = opts.sections[box.id];
    if (!m) return;
    const active = box.id === opts.activeSectionId;
    const stroke = active ? "#c56a2d" : m.done ? "#1f7a4d" : layer === "door" ? "#5c4030" : "#4e2f1c";
    const sw = active ? 3.5 : m.done ? 2.5 : 1.5;
    const baseOpacity = layer === "door" ? 0.48 : 0.72;
    const opacity = active || m.done ? (layer === "door" ? 0.88 : 1) : baseOpacity;
    let fill = m.done ? "#e4f2e8" : fills[box.kind];
    if (layer === "door" && !m.done && !active) fill = "rgba(196,168,130,0.55)";

    rects += `<rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" opacity="${opacity}" rx="2"/>`;

    if (box.kind === "hang") {
      const ry = box.y + box.h * 0.22;
      rects += `<line x1="${box.x + 10}" y1="${ry}" x2="${box.x + box.w - 10}" y2="${ry}" stroke="#6a4c34" stroke-width="3"/>`;
    }

    const wTxt = formatCm(m.widthCm);
    const hTxt = formatCm(m.heightCm);
    const txt = layer === "door" ? `Puerta ${wTxt}×${hTxt}` : `${wTxt}×${hTxt} cm`;
    if (box.h >= 36) {
      labels += `<text x="${box.x + box.w / 2}" y="${box.y + box.h / 2 + 4}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="10" fill="#3d2a1a" font-weight="${active ? "700" : "500"}">${txt}</text>`;
      if (m.done) {
        labels += `<text x="${box.x + box.w / 2}" y="${box.y + box.h / 2 + 20}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="9" font-weight="700" fill="#1f7a4d">✓</text>`;
      }
    }
  };

  for (const box of layout.innerBoxes) drawBox(box, "inner");
  if (showDoors) {
    for (const box of layout.doorBoxes) drawBox(box, "door");
  }

  const measurable = allSectionDefs(opts.template);
  const progress = measurable.filter((s) => opts.sections[s.id]?.done).length;
  const total = measurable.length;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${layout.viewW} ${layout.viewH}" role="img" aria-label="Plano frontal del clóset">
  <rect width="100%" height="100%" fill="#fbf7f1"/>
  <rect x="${layout.ox}" y="${layout.oy}" width="${layout.rw}" height="${layout.rh}" fill="#8d5a32" rx="4"/>
  <rect x="${layout.ox + layout.frame}" y="${layout.oy + layout.frame}" width="${layout.innerW}" height="${layout.innerH}" fill="#f7f1e8"/>
  ${rects}
  ${labels}
  <text x="${layout.ox}" y="${layout.oy + layout.rh + 28}" font-family="system-ui,sans-serif" font-size="13" fill="#5c5146">Vista frontal · ${opts.outerWidthCm}×${opts.outerHeightCm} cm · ${progress}/${total} secciones listas</text>
</svg>`;
}

export function downloadPlanHtml(plan: VisualPlan) {
  const groupHtml = plan.partGroups
    .map((g) => {
      const rows = g.parts
        .map(
          (p) =>
            `<tr><td>${p.label}</td><td>${p.qty}</td><td>${(p.widthMm / 10).toFixed(1)}</td><td>${(p.heightMm / 10).toFixed(1)}</td><td>${p.depthMm ? (p.depthMm / 10).toFixed(1) : "—"}</td><td>${p.note ?? ""}</td></tr>`,
        )
        .join("");
      return `<h3>${g.label}</h3><table><thead><tr><th>Pieza</th><th>Cant.</th><th>Ancho cm</th><th>Alto cm</th><th>Fondo cm</th><th>Nota</th></tr></thead><tbody>${rows}</tbody></table>`;
    })
    .join("");
  const supplies = plan.supplies.map((s) => `<li>${s.qty} ${s.unit} · ${s.name}</li>`).join("");
  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"/><title>Plano ${plan.template.name}</title>
  <style>body{font-family:system-ui,sans-serif;padding:24px;color:#241c16} table{border-collapse:collapse;width:100%;margin:12px 0 20px} td,th{border:1px solid #ddd;padding:8px;font-size:14px} h1{font-size:22px} h3{margin-top:24px;font-size:17px}</style></head><body>
  <h1>${plan.template.name}</h1>
  <p>Material: ${plan.materialName} · ${plan.outerWidthCm}×${plan.outerHeightCm}×${plan.outerDepthCm} cm (an×al×fon)</p>
  ${plan.elevationSvg}
  <h2>Lista de corte por grupo</h2>
  ${groupHtml}
  <h3>Herrajes</h3><ul>${supplies}</ul>
  </body></html>`;
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `plano-closet-${Date.now()}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

function templateSectionsOverlap(a: TemplateSection, b: TemplateSection): boolean {
  const ax2 = a.fx + a.fw;
  const ay2 = a.fy + a.fh;
  const bx2 = b.fx + b.fw;
  const by2 = b.fy + b.fh;
  const eps = 0.0001;
  return a.fx < bx2 - eps && ax2 > b.fx + eps && a.fy < by2 - eps && ay2 > b.fy + eps;
}

/** Detecta zonas que comparten área en la rejilla (error de plantilla). */
/** Huecos en la rejilla 0–1 (zonas sin asignar). */
export function findTemplateLayoutGaps(template: ClosetTemplate, grid = 24): string[] {
  const gridN = grid;
  const covered = new Array(gridN * gridN).fill(false);
  for (const s of template.sections) {
    const x0 = Math.floor(s.fx * gridN);
    const x1 = Math.ceil((s.fx + s.fw) * gridN);
    const y0 = Math.floor(s.fy * gridN);
    const y1 = Math.ceil((s.fy + s.fh) * gridN);
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        if (x >= 0 && x < gridN && y >= 0 && y < gridN) covered[y * gridN + x] = true;
      }
    }
  }
  const holes: string[] = [];
  for (let y = 0; y < gridN; y++) {
    for (let x = 0; x < gridN; x++) {
      if (!covered[y * gridN + x]) {
        holes.push(`celda ${x},${y} (~${roundCm((1 / gridN) * 100)}% del interior)`);
      }
    }
  }
  return holes.length > gridN * 2 ? [`${holes.length} celdas vacías`] : holes;
}

export function findTemplateLayoutOverlaps(template: ClosetTemplate): string[] {
  const zones = template.sections;
  const issues: string[] = [];
  for (let i = 0; i < zones.length; i++) {
    for (let j = i + 1; j < zones.length; j++) {
      if (templateSectionsOverlap(zones[i], zones[j])) {
        issues.push(`${zones[i].id} ↔ ${zones[j].id}`);
      }
    }
  }
  return issues;
}

if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
  for (const t of CLOSET_TEMPLATES) {
    const bad = findTemplateLayoutOverlaps(t);
    if (bad.length > 0) console.warn(`[jacm-carpinteria] Plantilla "${t.id}" solapes:`, bad);
    const gaps = findTemplateLayoutGaps(t);
    if (gaps.length > 0) console.warn(`[jacm-carpinteria] Plantilla "${t.id}" huecos sin zona:`, gaps.slice(0, 8));
  }
}