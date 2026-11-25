import type { ClosetTemplate } from "@/lib/closet-design";

import { LOCAL_PLANS_KEY } from "./brand";

export { LOCAL_PLANS_KEY };

export function readLocalPlans(): ClosetTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_PLANS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ClosetTemplate[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeLocalPlans(plans: ClosetTemplate[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_PLANS_KEY, JSON.stringify(plans));
}

export function upsertLocalPlan(plan: ClosetTemplate) {
  const plans = readLocalPlans().filter((p) => p.id !== plan.id);
  writeLocalPlans([plan, ...plans]);
}

export function deleteLocalPlan(planId: string) {
  writeLocalPlans(readLocalPlans().filter((p) => p.id !== planId));
}