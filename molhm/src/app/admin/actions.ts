"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { audit } from "@/lib/audit";

const STATUS = ["new","under_review","awaiting_contact","slot_proposed","awaiting_payment","confirmed","completed","closed","not_suitable"] as const;

export async function signIn(_: unknown, fd: FormData) {
  const sb = createClient();
  const { error } = await sb.auth.signInWithPassword({ email: String(fd.get("email")), password: String(fd.get("password")) });
  if (error) return { error: "بيانات الدخول غير صحيحة" };
  return { ok: true };
}
export async function signOut() { await createClient().auth.signOut(); }

export async function updateLead(id: string, patch: { status?: string; assigned_to?: string | null; priority?: number }) {
  const staff = await requireStaff();
  const p = z.object({ status: z.enum(STATUS).optional(), assigned_to: z.string().uuid().nullable().optional(), priority: z.number().int().min(1).max(3).optional() }).parse(patch);
  const sb = createClient();
  const extra = p.status && ["awaiting_contact", "slot_proposed", "awaiting_payment", "confirmed"].includes(p.status) ? { last_followup_at: new Date().toISOString() } : {};
  const { error } = await sb.from("leads").update({ ...p, ...extra }).eq("id", id);
  if (error) throw new Error(error.message);
  await audit(staff.id, "lead_update", "lead", id, p);
  revalidatePath(`/admin/leads/${id}`); revalidatePath("/admin/leads");
}

export async function addNote(id: string, body: string) {
  const staff = await requireStaff(); const text = z.string().trim().min(1).max(4000).parse(body);
  const { error } = await createClient().from("notes").insert({ lead_id: id, author_id: staff.id, body: text });
  if (error) throw new Error(error.message);
  await audit(staff.id, "note_add", "lead", id); revalidatePath(`/admin/leads/${id}`);
}

export async function addTask(id: string, title: string, dueAt: string) {
  const staff = await requireStaff();
  const p = z.object({ title: z.string().trim().min(1).max(200), dueAt: z.string().min(8) }).parse({ title, dueAt });
  const { error } = await createClient().from("followup_tasks").insert({ lead_id: id, assignee_id: staff.id, title: p.title, due_at: new Date(p.dueAt).toISOString() });
  if (error) throw new Error(error.message);
  await audit(staff.id, "task_add", "lead", id); revalidatePath(`/admin/leads/${id}`);
}

/** يقترح/يؤكد موعداً. الفهرس الفريد يمنع الحجز المزدوج على مستوى قاعدة البيانات. */
export async function bookSlot(id: string, slotId: string, confirm: boolean) {
  const staff = await requireStaff(); const sb = createClient();
  await sb.from("bookings").update({ status: "cancelled" }).eq("lead_id", id).in("status", ["proposed", "confirmed"]);
  const { error } = await sb.from("bookings").insert({ lead_id: id, slot_id: slotId, status: confirm ? "confirmed" : "proposed", created_by: staff.id });
  if (error) return { error: error.code === "23505" ? "هذا الموعد محجوز بالفعل لعميل آخر." : error.message };
  await sb.from("availability_slots").update({ is_open: !confirm }).eq("id", slotId);
  await sb.from("leads").update({ status: confirm ? "confirmed" : "slot_proposed", last_followup_at: new Date().toISOString() }).eq("id", id);
  await audit(staff.id, confirm ? "booking_confirm" : "booking_propose", "lead", id, { slotId });
  revalidatePath(`/admin/leads/${id}`); return { ok: true };
}

export async function addSlot(startsAt: string, minutes: number) {
  const staff = await requireStaff();
  const s = new Date(startsAt); if (isNaN(+s)) return { error: "تاريخ غير صحيح" };
  const { error } = await createClient().from("availability_slots").insert({ starts_at: s.toISOString(), ends_at: new Date(+s + minutes * 60000).toISOString(), mode: "any" });
  if (error) return { error: error.message };
  await audit(staff.id, "slot_add", "slot"); revalidatePath("/admin/manage"); return { ok: true };
}
export async function removeSlot(id: string) {
  const staff = await requireStaff(); await createClient().from("availability_slots").delete().eq("id", id);
  await audit(staff.id, "slot_remove", "slot", id); revalidatePath("/admin/manage");
}

export async function savePlan(slug: string, price: string, published: boolean, features: string, title: string, description: string) {
  const staff = await requireStaff({ adminOnly: true });
  const n = price.trim() === "" ? null : Number(price);
  if (n !== null && (!isFinite(n) || n < 0)) return { error: "سعر غير صحيح" };
  if (published && n === null) return { error: "لا يمكن نشر سعر فارغ" };
  const { error } = await createClient().from("plans").update({
    price_qar: n, price_published: published, title_ar: title, description_ar: description,
    features: features.split("\n").map((s) => s.trim()).filter(Boolean),
  }).eq("slug", slug);
  if (error) return { error: error.message };
  await audit(staff.id, "plan_update", "plan", slug, { price: n, published });
  revalidatePath("/pricing"); revalidatePath("/packages"); revalidatePath("/admin/manage"); return { ok: true };
}

export async function saveContent(key: string, json: string) {
  const staff = await requireStaff({ adminOnly: true });
  let value: unknown; try { value = JSON.parse(json); } catch { return { error: "JSON غير صالح" }; }
  const { error } = await createClient().from("site_content").upsert({ key, value, updated_by: staff.id, updated_at: new Date().toISOString() });
  if (error) return { error: error.message };
  await audit(staff.id, "content_update", "site_content", key);
  revalidatePath("/", "layout"); return { ok: true };
}
