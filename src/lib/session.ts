import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "./brand";
import { prisma } from "./db";

const COOKIE = SESSION_COOKIE;
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("Falta AUTH_SECRET");
  return value;
}

export function signSession(id: string) {
  const exp = Date.now() + MAX_AGE_MS;
  const payload = `${id}.${exp}`;
  const sig = createHmac("sha256", secret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export async function readSessionId() {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;
  const parts = raw.split(".");
  if (parts.length !== 3) return null;
  const [id, exp, sig] = parts;
  if (!id || !exp || !sig) return null;
  const expected = createHmac("sha256", secret()).update(`${id}.${exp}`).digest("hex");
  const left = Buffer.from(sig);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  if (Number(exp) < Date.now()) return null;
  return id;
}

export async function setSessionCookie(id: string) {
  const jar = await cookies();
  jar.set(COOKIE, signSession(id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_MS / 1000,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getCurrentCarpenter() {
  const id = await readSessionId();
  if (!id) return null;
  return prisma.carpenter.findUnique({
    where: { id },
    select: { id: true, name: true },
  });
}

export async function requireCarpenter() {
  const user = await getCurrentCarpenter();
  if (!user) redirect("/entrar");
  return user;
}
