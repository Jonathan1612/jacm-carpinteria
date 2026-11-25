import bcrypt from "bcryptjs";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { DEFAULT_MATERIALS, DEMO_PASSWORD, SHOP, type DemoKind } from "../src/lib/demo-data";

const prisma = new PrismaClient();
const uploadDir = path.join(process.cwd(), "data", "uploads");

function tile(title: string, drawing: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="#f3eadf"/>
  <rect x="28" y="28" width="744" height="544" rx="20" fill="#fbf7f1" stroke="#e4d3c0"/>
  ${drawing}
  <text x="56" y="530" font-family="Georgia, serif" font-size="28" fill="#4e2f1c">${title}</text>
</svg>`;
}

const drawings: Record<DemoKind, string> = {
  closet: `
    <rect x="210" y="110" width="170" height="360" rx="6" fill="#e2c29a" stroke="#4e2f1c" stroke-width="6"/>
    <rect x="400" y="110" width="170" height="360" rx="6" fill="#c99662" stroke="#4e2f1c" stroke-width="6"/>
    <line x1="295" y1="130" x2="295" y2="450" stroke="#4e2f1c" stroke-width="4"/>
    <line x1="485" y1="130" x2="485" y2="450" stroke="#4e2f1c" stroke-width="4"/>`,
  cocina: `
    <rect x="150" y="250" width="500" height="28" fill="#8d5a32"/>
    <rect x="160" y="278" width="150" height="180" fill="#d7b48a" stroke="#4e2f1c" stroke-width="5"/>
    <rect x="320" y="278" width="150" height="180" fill="#c99662" stroke="#4e2f1c" stroke-width="5"/>
    <rect x="480" y="278" width="150" height="180" fill="#e2c29a" stroke="#4e2f1c" stroke-width="5"/>`,
  puerta: `
    <rect x="300" y="90" width="200" height="400" rx="6" fill="#c99662" stroke="#4e2f1c" stroke-width="6"/>`,
  pergola: `<rect x="180" y="160" width="16" height="300" fill="#4e2f1c"/>`,
  reparacion: `<rect x="250" y="150" width="300" height="130" rx="16" fill="#e2c29a" stroke="#4e2f1c" stroke-width="5"/>`,
  repisa: `
    <rect x="220" y="140" width="360" height="18" fill="#8d5a32"/>
    <rect x="220" y="250" width="360" height="18" fill="#c99662"/>`,
};

async function main() {
  await mkdir(uploadDir, { recursive: true });
  await prisma.visitRequest.deleteMany();
  await prisma.photo.deleteMany();
  await prisma.material.deleteMany();
  await prisma.carpenter.deleteMany();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  for (const photo of SHOP.photos) {
    const svg = tile(photo.caption, drawings[photo.kind]);
    await writeFile(path.join(uploadDir, photo.file), svg, "utf8");
  }

  const carpenter = await prisma.carpenter.create({
    data: {
      name: SHOP.name,
      email: SHOP.email,
      phone: SHOP.phone,
      city: SHOP.city,
      zone: SHOP.zone,
      bio: SHOP.bio,
      passwordHash,
      services: JSON.stringify(SHOP.services),
      availableDays: JSON.stringify(SHOP.days),
      photos: {
        create: SHOP.photos.map((photo) => ({
          filename: photo.file,
          caption: photo.caption,
        })),
      },
      materials: {
        create: DEFAULT_MATERIALS.map((item, index) => ({
          name: item.name,
          thicknessMm: item.thicknessMm,
          pricePerSheet: item.pricePerSheet,
          pricePerLinearMeter: item.pricePerLinearMeter,
          notes: item.notes,
          sortOrder: index,
        })),
      },
    },
  });

  console.log(`Taller listo: ${carpenter.email} / ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });