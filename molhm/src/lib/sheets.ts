import "server-only";
import { JWT } from "google-auth-library";
import { adminClient } from "./supabase/admin";
import { SCORE_FIELDS } from "./scales";

const HEADERS = ["رقم الطلب", "الاسم", "الهاتف", "البريد", "الخدمة", "الباقة", "الحالة", "تاريخ الطلب", "آخر تحديث"];
export const sheetsConfigured = () =>
  !!(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY && process.env.GOOGLE_SHEET_ID);

async function token() {
  const jwt = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return (await jwt.getAccessToken()).token!;
}

/** Idempotent: يبحث عن رقم الطلب في العمود A ويحدّث الصف، وإلا يضيف صفاً جديداً. */
export async function upsertLeadRow(lead: Record<string, any>, scores?: Record<string, number> | null) {
  const id = process.env.GOOGLE_SHEET_ID!, tab = encodeURIComponent(process.env.GOOGLE_SHEET_TAB || "Leads");
  const includeScores = process.env.SHEETS_INCLUDE_SCORES === "true" && scores;
  const row = [lead.ref_code, lead.full_name, lead.phone, lead.email, lead.service_title ?? "", lead.plan_title ?? "", lead.status, lead.created_at, lead.updated_at,
    ...(includeScores ? SCORE_FIELDS.map((f) => scores![f.key]) : [])];
  const t = await token();
  const h = { Authorization: `Bearer ${t}`, "Content-Type": "application/json" };
  const base = `https://sheets.googleapis.com/v4/spreadsheets/${id}/values`;
  const colA = await (await fetch(`${base}/${tab}!A:A`, { headers: h })).json();
  if (colA.error) throw new Error(colA.error.message);
  const values: string[][] = colA.values ?? [];
  if (!values.length) {
    const head = [...HEADERS, ...(includeScores ? SCORE_FIELDS.map((f) => f.label) : [])];
    await fetch(`${base}/${tab}!A1?valueInputOption=RAW`, { method: "PUT", headers: h, body: JSON.stringify({ values: [head] }) });
    values.push(["h"]);
  }
  const idx = values.findIndex((r) => r[0] === lead.ref_code);
  const res = idx >= 0
    ? await fetch(`${base}/${tab}!A${idx + 1}?valueInputOption=RAW`, { method: "PUT", headers: h, body: JSON.stringify({ values: [row] }) })
    : await fetch(`${base}/${tab}!A1:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, { method: "POST", headers: h, body: JSON.stringify({ values: [row] }) });
  if (!res.ok) throw new Error(`sheets ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

/** يعالج طابور sheets_outbox مع إعادة المحاولة (حد أقصى 8 محاولات). */
export async function drainOutbox(limit = 25) {
  if (!sheetsConfigured()) return { processed: 0, skipped: true };
  const db = adminClient();
  const { data: items } = await db.from("sheets_outbox").select("id,lead_id,attempts").is("synced_at", null).lt("attempts", 8).order("created_at").limit(limit);
  let ok = 0;
  for (const it of items ?? []) {
    try {
      const { data: lead } = await db.from("leads").select("*, services(title_ar), plans(title_ar)").eq("id", it.lead_id).single();
      let scores = null;
      if (process.env.SHEETS_INCLUDE_SCORES === "true")
        scores = (await db.from("form_answer_sets").select("*").eq("lead_id", it.lead_id).order("created_at", { ascending: false }).limit(1).maybeSingle()).data;
      await upsertLeadRow({ ...lead, service_title: lead.services?.title_ar, plan_title: lead.plans?.title_ar }, scores);
      await db.from("sheets_outbox").update({ synced_at: new Date().toISOString(), last_error: null }).eq("id", it.id); ok++;
    } catch (e: any) {
      await db.from("sheets_outbox").update({ attempts: it.attempts + 1, last_error: String(e.message).slice(0, 300) }).eq("id", it.id);
    }
  }
  return { processed: ok, total: items?.length ?? 0 };
}
