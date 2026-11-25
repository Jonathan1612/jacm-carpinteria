import { labelFor, SERVICES, type ServiceId } from "./catalog";

export type PlanPart = {
  code: string;
  name: string;
  qty: number;
  widthMm: number;
  heightMm: number;
  thicknessMm: number;
  materialName: string;
};

export type PlanSupply = {
  name: string;
  qty: number;
  unit: string;
  note?: string;
};

export type PlanEstimate = {
  serviceId: ServiceId;
  serviceLabel: string;
  materialName: string;
  outerWidthMm: number;
  outerHeightMm: number;
  outerDepthMm: number;
  parts: PlanPart[];
  supplies: PlanSupply[];
  usedAreaM2: number;
  sheetsNeeded: number;
  sheetLabel: string;
  priceEstimateMxn: number;
  priceNote: string;
  sketchSvg: string;
};

type MaterialInput = {
  name: string;
  thicknessMm: number;
  pricePerSheet: number;
  sheetWidthMm: number;
  sheetHeightMm: number;
  pricePerLinearMeter: number;
};

const BACK_MM = 6;

function mm2(area: number) {
  return area / 1_000_000;
}

function sheetCount(
  parts: { widthMm: number; heightMm: number; qty: number }[],
  sheetW: number,
  sheetH: number,
) {
  let used = 0;
  for (const part of parts) {
    used += part.widthMm * part.heightMm * part.qty;
  }
  const sheetArea = sheetW * sheetH;
  const sheets = Math.ceil((used / sheetArea) * 1.12);
  return { usedAreaM2: mm2(used), sheetsNeeded: Math.max(1, sheets) };
}

function closetSketch(w: number, h: number, d: number, shelves: number) {
  const pad = 40;
  const maxW = 520;
  const scale = maxW / Math.max(w, d, 1);
  const rw = w * scale;
  const rh = h * scale;
  const rd = d * scale * 0.45;
  const ox = pad;
  const oy = pad + rd;
  const shelfYs = Array.from({ length: shelves }, (_, i) => oy + ((rh / (shelves + 1)) * (i + 1)));
  const shelvesSvg = shelfYs
    .map((y) => `<line x1="${ox + 8}" y1="${y}" x2="${ox + rw - 8}" y2="${y}" stroke="#4e2f1c" stroke-width="2"/>`)
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${rw + pad * 2} ${rh + pad * 2 + rd}" role="img" aria-label="Vista frontal del clóset">
  <rect width="100%" height="100%" fill="#fbf7f1"/>
  <polygon points="${ox},${oy} ${ox + rw},${oy} ${ox + rw - rd},${oy - rd} ${ox - rd},${oy - rd}" fill="#e2c29a" stroke="#4e2f1c" stroke-width="3"/>
  <rect x="${ox}" y="${oy}" width="${rw}" height="${rh}" fill="#f3e6d6" stroke="#4e2f1c" stroke-width="4"/>
  <line x1="${ox + rw / 2}" y1="${oy}" x2="${ox + rw / 2}" y2="${oy + rh}" stroke="#4e2f1c" stroke-width="3"/>
  ${shelvesSvg}
  <text x="${ox}" y="${oy + rh + 28}" font-family="system-ui,sans-serif" font-size="14" fill="#5c5146">${(w / 10).toFixed(0)} cm ancho · ${(h / 10).toFixed(0)} cm alto · ${(d / 10).toFixed(0)} cm fondo</text>
</svg>`;
}

function buildCloset(
  wMm: number,
  hMm: number,
  dMm: number,
  shelves: number,
  material: MaterialInput,
): Omit<PlanEstimate, "serviceId" | "serviceLabel" | "priceEstimateMxn" | "priceNote"> {
  const t = material.thicknessMm;
  const innerW = wMm - t * 2;
  const parts: PlanPart[] = [
    { code: "A", name: "Costado izquierdo", qty: 1, widthMm: dMm, heightMm: hMm, thicknessMm: t, materialName: material.name },
    { code: "B", name: "Costado derecho", qty: 1, widthMm: dMm, heightMm: hMm, thicknessMm: t, materialName: material.name },
    { code: "C", name: "Base", qty: 1, widthMm: innerW, heightMm: dMm, thicknessMm: t, materialName: material.name },
    { code: "D", name: "Tapa", qty: 1, widthMm: innerW, heightMm: dMm, thicknessMm: t, materialName: material.name },
    {
      code: "E",
      name: "Fondo (triplay)",
      qty: 1,
      widthMm: innerW,
      heightMm: hMm - t * 2,
      thicknessMm: BACK_MM,
      materialName: "Triplay 6 mm",
    },
    ...Array.from({ length: shelves }, (_, i) => ({
      code: `F${i + 1}`,
      name: `Entrepaño ${i + 1}`,
      qty: 1,
      widthMm: innerW,
      heightMm: dMm,
      thicknessMm: t,
      materialName: material.name,
    })),
    {
      code: "G1",
      name: "Puerta izquierda",
      qty: 1,
      widthMm: Math.floor(wMm / 2) - 4,
      heightMm: hMm - 4,
      thicknessMm: t,
      materialName: material.name,
    },
    {
      code: "G2",
      name: "Puerta derecha",
      qty: 1,
      widthMm: Math.floor(wMm / 2) - 4,
      heightMm: hMm - 4,
      thicknessMm: t,
      materialName: material.name,
    },
  ];

  const supplies: PlanSupply[] = [
    { name: "Bisagra conceal", qty: 8, unit: "pzas", note: "4 por puerta" },
    { name: "Jaladera", qty: 2, unit: "pzas" },
    { name: "Canto ABS", qty: Math.ceil(parts.filter((p) => p.thicknessMm === t).length * 2.4), unit: "m", note: "Estimado para cantos visibles" },
    { name: "Tornillo confirmat", qty: 24, unit: "pzas" },
    { name: "Taquete", qty: shelves + 8, unit: "pzas" },
  ];

  const sheetParts = parts.filter((p) => p.thicknessMm === t).map((p) => ({ widthMm: p.widthMm, heightMm: p.heightMm, qty: p.qty }));
  const { usedAreaM2, sheetsNeeded } = sheetCount(sheetParts, material.sheetWidthMm, material.sheetHeightMm);

  return {
    materialName: material.name,
    outerWidthMm: wMm,
    outerHeightMm: hMm,
    outerDepthMm: dMm,
    parts,
    supplies,
    usedAreaM2,
    sheetsNeeded,
    sheetLabel: `${material.sheetWidthMm / 10} × ${material.sheetHeightMm / 10} cm`,
    sketchSvg: closetSketch(wMm, hMm, dMm, shelves),
  };
}

function buildRepisa(wMm: number, hMm: number, dMm: number, levels: number, material: MaterialInput) {
  const t = material.thicknessMm;
  const parts: PlanPart[] = [
    { code: "A", name: "Lateral", qty: 2, widthMm: dMm, heightMm: hMm, thicknessMm: t, materialName: material.name },
    { code: "B", name: "Repisa", qty: levels, widthMm: wMm - t * 2, heightMm: dMm, thicknessMm: t, materialName: material.name },
    { code: "C", name: "Trasera", qty: 1, widthMm: wMm - t * 2, heightMm: hMm, thicknessMm: BACK_MM, materialName: "Triplay 6 mm" },
  ];
  const supplies: PlanSupply[] = [
    { name: "Canto ABS", qty: Math.ceil(levels * 1.5), unit: "m" },
    { name: "Tornillo", qty: levels * 8, unit: "pzas" },
  ];
  const sheetParts = parts.filter((p) => p.materialName === material.name).map((p) => ({ widthMm: p.widthMm, heightMm: p.heightMm, qty: p.qty }));
  const { usedAreaM2, sheetsNeeded } = sheetCount(sheetParts, material.sheetWidthMm, material.sheetHeightMm);
  return {
    materialName: material.name,
    outerWidthMm: wMm,
    outerHeightMm: hMm,
    outerDepthMm: dMm,
    parts,
    supplies,
    usedAreaM2,
    sheetsNeeded,
    sheetLabel: `${material.sheetWidthMm / 10} × ${material.sheetHeightMm / 10} cm`,
    sketchSvg: closetSketch(wMm, hMm, dMm, levels),
  };
}

function buildCocinaModule(wMm: number, hMm: number, dMm: number, material: MaterialInput) {
  return buildCloset(wMm, hMm, dMm, 1, material);
}

export function buildPlan(input: {
  serviceId: ServiceId;
  widthCm: number;
  heightCm: number;
  depthCm: number;
  shelves: number;
  material: MaterialInput;
}): PlanEstimate {
  const wMm = Math.round(input.widthCm * 10);
  const hMm = Math.round(input.heightCm * 10);
  const dMm = Math.round(input.depthCm * 10);
  const shelves = Math.min(6, Math.max(0, input.shelves));

  if (wMm < 400 || hMm < 800 || dMm < 300) {
    throw new Error("MEDIDAS");
  }

  let body: Omit<PlanEstimate, "serviceId" | "serviceLabel" | "priceEstimateMxn" | "priceNote">;
  if (input.serviceId === "closet") {
    body = buildCloset(wMm, hMm, dMm, shelves, input.material);
  } else if (input.serviceId === "mueble") {
    body = buildRepisa(wMm, hMm, dMm, Math.max(2, shelves || 3), input.material);
  } else if (input.serviceId === "cocina") {
    body = buildCocinaModule(wMm, hMm, dMm, input.material);
  } else {
    throw new Error("SERVICIO");
  }

  const widthM = input.widthCm / 100;
  const linearPrice = materialLinearPrice(input.serviceId, input.material);
  const priceEstimateMxn = Math.round(widthM * linearPrice);

  return {
    serviceId: input.serviceId,
    serviceLabel: labelFor(input.serviceId, SERVICES),
    ...body,
    priceEstimateMxn,
    priceNote: `Estimado por ${(input.widthCm / 100).toFixed(2)} m de ancho a $${linearPrice.toLocaleString("es-MX")}/m lineal. No incluye instalación ni cubiertas.`,
  };
}

function materialLinearPrice(serviceId: ServiceId, material: MaterialInput) {
  const base = material.pricePerLinearMeter;
  if (serviceId === "cocina") return Math.round(base * 1.25);
  if (serviceId === "mueble") return Math.round(base * 0.85);
  return base;
}