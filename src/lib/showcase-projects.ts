export type ShowcaseImage = { src: string; alt: string };

export type ShowcaseProject = {
  id: string;
  title: string;
  subtitle: string;
  tags: string[];
  images: ShowcaseImage[];
  /** Foto subida por el taller (no stock). */
  fromTaller?: boolean;
};

/**
 * Ejemplos de carpintería (archivos locales, sin enlaces aleatorios a stock).
 * Sustituye esto con fotos reales en Administrar → Fotos.
 */
export const DEMO_SHOWCASE: ShowcaseProject[] = [
  {
    id: "demo-closet",
    title: "Clóset empotrado",
    subtitle: "Barras, cajones y zapatera",
    tags: ["Clóset", "Ejemplo"],
    images: [
      { src: "/showcase/closet-foto.jpg", alt: "Clóset con repisas y cajones" },
      { src: "/showcase/demo-closet.svg", alt: "Plano ilustrado de clóset" },
    ],
  },
  {
    id: "demo-cocina",
    title: "Cocina integral",
    subtitle: "Gabinetes bajos y altos",
    tags: ["Cocina", "Ejemplo"],
    images: [{ src: "/showcase/demo-cocina.svg", alt: "Ilustración de cocina integral" }],
  },
  {
    id: "demo-mesa",
    title: "Mesa de comedor",
    subtitle: "Madera maciza",
    tags: ["Mueble", "Ejemplo"],
    images: [
      { src: "/showcase/demo-mesa.svg", alt: "Ilustración de mesa de comedor" },
      { src: "/showcase/muebles-foto.jpg", alt: "Muebles de madera" },
    ],
  },
  {
    id: "demo-repisa",
    title: "Repisas y librero",
    subtitle: "Módulos a medida",
    tags: ["Repisa", "Ejemplo"],
    images: [{ src: "/showcase/demo-repisa.svg", alt: "Ilustración de repisas" }],
  },
];