export const DEMO_PASSWORD = "taller1234";

export type DemoKind = "closet" | "cocina" | "puerta" | "pergola" | "reparacion" | "repisa";

import { DEFAULT_SHOP_EMAIL } from "./brand";

export const SHOP = {
  email: DEFAULT_SHOP_EMAIL,
  name: "Taller El Roble",
  phone: "3315550198",
  city: "Guadalajara",
  zone: "Zona metropolitana, Zapopan y Tlaquepaque",
  bio: "Clósets, cocinas y muebles a medida. Te ayudo a elegir el material y armamos una lista de piezas antes de fabricar.",
  services: ["closet", "cocina", "mueble", "puerta", "reparacion"],
  days: ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado"],
  photos: [
    { file: "ana-closet.svg", caption: "Clóset melamina blanca", kind: "closet" as DemoKind },
    { file: "ana-cocina.svg", caption: "Cocina integral encino", kind: "cocina" as DemoKind },
    { file: "luis-puerta.svg", caption: "Puerta de tambor", kind: "puerta" as DemoKind },
  ],
};

export const DEFAULT_MATERIALS = [
  {
    name: "Aglomerado melamina 18 mm",
    thicknessMm: 18,
    pricePerSheet: 300,
    pricePerLinearMeter: 6200,
    notes: "Blanco o roble claro. Muy usado en clósets.",
  },
  {
    name: "MDF melamina 18 mm",
    thicknessMm: 18,
    pricePerSheet: 352,
    pricePerLinearMeter: 7200,
    notes: "Superficie más pareja que aglomerado.",
  },
  {
    name: "MDF enchapado 18 mm",
    thicknessMm: 18,
    pricePerSheet: 520,
    pricePerLinearMeter: 9800,
    notes: "Veta de madera natural.",
  },
  {
    name: "Aglomerado natural 19 mm",
    thicknessMm: 19,
    pricePerSheet: 280,
    pricePerLinearMeter: 5400,
    notes: "Opción económica para interiores.",
  },
];