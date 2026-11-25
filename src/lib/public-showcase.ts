import type { ShowcaseProject } from "@/lib/showcase-projects";
import { DEMO_SHOWCASE } from "@/lib/showcase-projects";

type ShopPhoto = { id: string; filename: string; caption: string | null };

export function buildPublicShowcase(photos: ShopPhoto[]): {
  projects: ShowcaseProject[];
  showStockNote: boolean;
} {
  const tallerProjects: ShowcaseProject[] = photos.map((photo) => ({
    id: `taller-${photo.id}`,
    title: photo.caption || "Trabajo del taller",
    subtitle: "Publicado por el taller",
    tags: ["Del taller"],
    fromTaller: true,
    images: [
      {
        src: `/fotos/${photo.filename}`,
        alt: photo.caption || "Trabajo publicado por el carpintero",
      },
    ],
  }));

  if (tallerProjects.length > 0) {
    return { projects: tallerProjects, showStockNote: false };
  }

  return {
    projects: DEMO_SHOWCASE,
    showStockNote: true,
  };
}