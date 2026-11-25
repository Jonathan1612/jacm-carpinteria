import { DEFAULT_SHOP_EMAIL } from "./brand";
import { prisma } from "./db";

export { DEFAULT_SHOP_EMAIL };

export function shopEmail() {
  return (process.env.SHOP_EMAIL ?? DEFAULT_SHOP_EMAIL).toLowerCase();
}

export async function getShop() {
  return prisma.carpenter.findUnique({
    where: { email: shopEmail() },
    include: {
      photos: { orderBy: { createdAt: "desc" } },
      materials: { where: { active: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] },
    },
  });
}

export async function getShopAdmin() {
  const user = await prisma.carpenter.findUnique({
    where: { email: shopEmail() },
    include: {
      photos: { orderBy: { createdAt: "desc" } },
      materials: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] },
      requests: { orderBy: { createdAt: "desc" } },
    },
  });
  return user;
}