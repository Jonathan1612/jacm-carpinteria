"use server";

import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "./db";
import {
  DAYS,
  MAX_PHOTOS,
  REQUEST_STATUS,
  SERVICES,
  labelFor,
  readIds,
  type RequestStatus,
} from "./catalog";
import { isMexicanMobile, phoneDigits, whatsappUrl } from "./phone";
import { removePhotoFile, savePhotoFile } from "./photos";
import { buildPlan, type PlanEstimate } from "./plan";
import { getShop, shopEmail } from "./shop";
import { clearSessionCookie, requireCarpenter, setSessionCookie } from "./session";

export type ActionState = { error?: string; ok?: string };
export type RequestState = { error?: string; ok?: string; whatsapp?: string };
export type PlanState = { error?: string; plan?: PlanEstimate };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanText(value: FormDataEntryValue | null, max: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function checkedIds(form: FormData, key: string, allowed: readonly { id: string }[]) {
  const ok = new Set(allowed.map((item) => item.id));
  return form
    .getAll(key)
    .filter((value): value is string => typeof value === "string" && ok.has(value));
}

function refreshCarpenter(_id: string) {
  revalidatePath("/");
  revalidatePath("/mi-taller");
}

export async function register(_prev: ActionState, form: FormData): Promise<ActionState> {
  const name = cleanText(form.get("name"), 80);
  const email = cleanText(form.get("email"), 120).toLowerCase();
  const password = cleanText(form.get("password"), 80);
  const phone = phoneDigits(cleanText(form.get("phone"), 20));
  const city = cleanText(form.get("city"), 80);
  const zone = cleanText(form.get("zone"), 160);

  if (name.length < 2) return { error: "Escribe tu nombre." };
  if (!EMAIL_RE.test(email)) return { error: "Escribe un correo válido." };
  if (password.length < 8) return { error: "La contraseña necesita al menos 8 caracteres." };
  if (!isMexicanMobile(phone)) return { error: "El WhatsApp necesita 10 dígitos." };
  if (city.length < 2) return { error: "Escribe la ciudad." };
  if (zone.length < 2) return { error: "Escribe la zona que cubres." };

  try {
    const carpenter = await prisma.carpenter.create({
      data: {
        name,
        email,
        phone,
        city,
        zone,
        passwordHash: await bcrypt.hash(password, 10),
      },
    });
    await setSessionCookie(carpenter.id);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "Ese correo ya tiene un taller. Entra con él." };
    }
    console.error(error);
    return { error: "No se pudo crear el taller. Intenta de nuevo." };
  }

  redirect("/mi-taller");
}

export async function login(_prev: ActionState, form: FormData): Promise<ActionState> {
  const email = cleanText(form.get("email"), 120).toLowerCase();
  const password = cleanText(form.get("password"), 80);
  if (email !== shopEmail()) {
    return { error: "Este acceso es solo para el administrador del taller." };
  }
  const user = await prisma.carpenter.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Correo o contraseña no coinciden." };
  }
  await setSessionCookie(user.id);
  redirect("/mi-taller");
}

export async function logout() {
  await clearSessionCookie();
  redirect("/");
}

export async function updateProfile(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireCarpenter();
  const name = cleanText(form.get("name"), 80);
  const phone = phoneDigits(cleanText(form.get("phone"), 20));
  const city = cleanText(form.get("city"), 80);
  const zone = cleanText(form.get("zone"), 160);
  const bio = cleanText(form.get("bio"), 500);
  const services = checkedIds(form, "services", SERVICES);
  const availableDays = checkedIds(form, "days", DAYS);

  if (name.length < 2) return { error: "Escribe tu nombre." };
  if (!isMexicanMobile(phone)) return { error: "El WhatsApp necesita 10 dígitos." };
  if (city.length < 2) return { error: "Escribe la ciudad." };
  if (zone.length < 2) return { error: "Escribe la zona que cubres." };

  await prisma.carpenter.update({
    where: { id: user.id },
    data: {
      name,
      phone,
      city,
      zone,
      bio,
      services: JSON.stringify(services),
      availableDays: JSON.stringify(availableDays),
    },
  });
  refreshCarpenter(user.id);
  return { ok: "Cambios guardados. Ya se ven en tu página." };
}

export async function addPhoto(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireCarpenter();
  const current = await prisma.photo.count({ where: { carpenterId: user.id } });
  if (current >= MAX_PHOTOS) {
    return { error: `Ya tienes ${MAX_PHOTOS} fotos. Quita una para subir otra.` };
  }

  const file = form.get("photo");
  if (!(file instanceof File) || file.size === 0) return { error: "Elige una foto." };
  const caption = cleanText(form.get("caption"), 80);
  const buf = Buffer.from(await file.arrayBuffer());

  let filename = "";
  try {
    filename = await savePhotoFile(buf);
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "TAMANO") return { error: "La foto pesa más de 4 MB." };
    if (code === "FORMATO") return { error: "Usa una foto JPG, PNG o WEBP." };
    console.error(error);
    return { error: "No se pudo guardar la foto." };
  }

  try {
    await prisma.photo.create({
      data: { carpenterId: user.id, filename, caption },
    });
  } catch (error) {
    await removePhotoFile(filename);
    console.error(error);
    return { error: "No se pudo guardar la foto." };
  }

  refreshCarpenter(user.id);
  return { ok: "Foto agregada." };
}

export async function deletePhoto(form: FormData) {
  const user = await requireCarpenter();
  const id = cleanText(form.get("id"), 40);
  const photo = await prisma.photo.findUnique({ where: { id } });
  if (!photo || photo.carpenterId !== user.id) redirect("/mi-taller");
  await prisma.photo.delete({ where: { id } });
  await removePhotoFile(photo.filename);
  refreshCarpenter(user.id);
  redirect("/mi-taller");
}

export async function requestVisit(_prev: RequestState, form: FormData): Promise<RequestState> {
  const carpenterId = cleanText(form.get("carpenterId"), 40);
  const clientName = cleanText(form.get("clientName"), 80);
  const clientPhone = phoneDigits(cleanText(form.get("clientPhone"), 20));
  const message = cleanText(form.get("message"), 400);
  const day = cleanText(form.get("day"), 20);

  if (clientName.length < 2) return { error: "Escribe tu nombre." };
  if (!isMexicanMobile(clientPhone)) return { error: "Tu teléfono necesita 10 dígitos." };
  if (message.length < 5) return { error: "Cuéntale un poco qué necesitas." };

  const carpenter = await prisma.carpenter.findUnique({ where: { id: carpenterId } });
  if (!carpenter) return { error: "Ese taller ya no está disponible." };

  const allowed = readIds(carpenter.availableDays);
  if (!allowed.includes(day)) return { error: "Elige uno de los días disponibles." };

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recent = await prisma.visitRequest.count({
    where: { carpenterId, clientPhone, createdAt: { gte: since } },
  });
  if (recent >= 5) {
    return { error: "Ya enviaste varias solicitudes hoy. Escríbele por WhatsApp." };
  }

  await prisma.visitRequest.create({
    data: { carpenterId, clientName, clientPhone, message, day, status: "nueva" },
  });

  const dayLabel = labelFor(day, DAYS);
  const text = `Hola, soy ${clientName}. Vi tu página en JACM Carpintería. Necesito: ${message}. ¿Puedes el ${dayLabel}? Mi teléfono es ${clientPhone}.`;
  refreshCarpenter(carpenterId);
  return {
    ok: "Listo. El carpintero ya tiene tu solicitud y el día que pediste.",
    whatsapp: whatsappUrl(carpenter.phone, text),
  };
}

export async function updateRequestStatus(form: FormData) {
  const user = await requireCarpenter();
  const id = cleanText(form.get("id"), 40);
  const status = cleanText(form.get("status"), 20);
  if (!(status in REQUEST_STATUS)) redirect("/mi-taller");
  const request = await prisma.visitRequest.findUnique({ where: { id } });
  if (!request || request.carpenterId !== user.id) redirect("/mi-taller");
  await prisma.visitRequest.update({
    where: { id },
    data: { status: status as RequestStatus },
  });
  refreshCarpenter(user.id);
  redirect("/mi-taller");
}

function parseMoney(raw: string) {
  const n = Number.parseFloat(raw.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export async function saveMaterial(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireCarpenter();
  const id = cleanText(form.get("id"), 40);
  const name = cleanText(form.get("name"), 80);
  const notes = cleanText(form.get("notes"), 200);
  const thicknessMm = Number.parseInt(cleanText(form.get("thicknessMm"), 4), 10);
  const pricePerSheet = parseMoney(cleanText(form.get("pricePerSheet"), 20));
  const pricePerLinearMeter = parseMoney(cleanText(form.get("pricePerLinearMeter"), 20));
  const sortOrder = Number.parseInt(cleanText(form.get("sortOrder"), 6) || "0", 10);

  if (name.length < 2) return { error: "Escribe el nombre del material." };
  if (!pricePerSheet || !pricePerLinearMeter) return { error: "Revisa los precios." };
  if (thicknessMm < 6 || thicknessMm > 40) return { error: "Espesor entre 6 y 40 mm." };

  const data = {
    name,
    notes,
    thicknessMm,
    pricePerSheet,
    pricePerLinearMeter,
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
    active: form.get("active") === "on",
  };

  if (id) {
    const existing = await prisma.material.findUnique({ where: { id } });
    if (!existing || existing.carpenterId !== user.id) return { error: "Material no encontrado." };
    await prisma.material.update({ where: { id }, data });
  } else {
    await prisma.material.create({ data: { ...data, carpenterId: user.id, active: true } });
  }

  refreshCarpenter(user.id);
  return { ok: id ? "Material actualizado." : "Material agregado." };
}

export async function deleteMaterial(form: FormData) {
  const user = await requireCarpenter();
  const id = cleanText(form.get("id"), 40);
  const material = await prisma.material.findUnique({ where: { id } });
  if (!material || material.carpenterId !== user.id) redirect("/mi-taller#materiales");
  await prisma.material.delete({ where: { id } });
  refreshCarpenter(user.id);
  redirect("/mi-taller#materiales");
}

export async function estimatePlan(_prev: PlanState, form: FormData): Promise<PlanState> {
  const shop = await getShop();
  if (!shop) return { error: "El taller todavía no está configurado." };

  const serviceId = cleanText(form.get("serviceId"), 20) as (typeof SERVICES)[number]["id"];
  if (!SERVICES.some((s) => s.id === serviceId)) {
    return { error: "Elige un tipo de mueble." };
  }
  if (serviceId === "reparacion" || serviceId === "pergola" || serviceId === "puerta") {
    return { error: "Por ahora el plano automático aplica a clóset, cocina o mueble. Para puertas y reparaciones escríbenos." };
  }

  const materialId = cleanText(form.get("materialId"), 40);
  const material = shop.materials.find((m) => m.id === materialId);
  if (!material) return { error: "Elige un material." };

  const widthCm = Number.parseFloat(cleanText(form.get("widthCm"), 10));
  const heightCm = Number.parseFloat(cleanText(form.get("heightCm"), 10));
  const depthCm = Number.parseFloat(cleanText(form.get("depthCm"), 10));
  const shelves = Number.parseInt(cleanText(form.get("shelves"), 3) || "3", 10);

  try {
    const plan = buildPlan({
      serviceId,
      widthCm,
      heightCm,
      depthCm,
      shelves,
      material: {
        name: material.name,
        thicknessMm: material.thicknessMm,
        pricePerSheet: material.pricePerSheet,
        sheetWidthMm: material.sheetWidthMm,
        sheetHeightMm: material.sheetHeightMm,
        pricePerLinearMeter: material.pricePerLinearMeter,
      },
    });
    return { plan };
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "MEDIDAS") {
      return { error: "Revisa las medidas: mínimo 40 cm ancho, 80 alto y 30 de fondo." };
    }
    return { error: "No se pudo armar el plan." };
  }
}
