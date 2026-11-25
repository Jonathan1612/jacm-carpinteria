export const SERVICES = [
  { id: "closet", label: "Closets" },
  { id: "puerta", label: "Puertas" },
  { id: "cocina", label: "Cocinas" },
  { id: "mueble", label: "Muebles a medida" },
  { id: "reparacion", label: "Reparaciones" },
  { id: "pergola", label: "Pérgolas y decks" },
] as const;

export const DAYS = [
  { id: "lunes", label: "Lunes" },
  { id: "martes", label: "Martes" },
  { id: "miercoles", label: "Miércoles" },
  { id: "jueves", label: "Jueves" },
  { id: "viernes", label: "Viernes" },
  { id: "sabado", label: "Sábado" },
  { id: "domingo", label: "Domingo" },
] as const;

export const MAX_PHOTOS = 12;
export const MAX_PHOTO_BYTES = 4 * 1024 * 1024;

export const REQUEST_STATUS = {
  nueva: "Nueva",
  confirmada: "Día confirmado",
  ocupado: "Ese día no puede",
} as const;

export type ServiceId = (typeof SERVICES)[number]["id"];
export type DayId = (typeof DAYS)[number]["id"];
export type RequestStatus = keyof typeof REQUEST_STATUS;

export function readIds(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

export function labelsFor(ids: string[], catalog: readonly { id: string; label: string }[]) {
  const map = new Map(catalog.map((item) => [item.id, item.label]));
  return ids.map((id) => map.get(id)).filter((label): label is string => Boolean(label));
}

export function labelFor(id: string, catalog: readonly { id: string; label: string }[]) {
  return catalog.find((item) => item.id === id)?.label ?? id;
}
