import { NextResponse } from "next/server";
import { submissionSchema, POLICY_VERSION } from "@/lib/validation";
import { rateLimit } from "@/lib/ratelimit";
import { hashIp } from "@/lib/ref";
import { supabaseConfigured } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { drainOutbox, sheetsConfigured } from "@/lib/sheets";
import { SCORE_FIELDS } from "@/lib/scales";

export const runtime = "nodejs";

async function captchaOk(token?: string, ip?: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // غير مفعّل
  if (!token) return false;
  const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST", body: new URLSearchParams({ secret, response: token, ...(ip ? { remoteip: ip } : {}) }),
  });
  return !!(await r.json()).success;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`submit:${ip}`, 5, 10 * 60_000)) return NextResponse.json({ error: "محاولات كثيرة، حاول لاحقاً." }, { status: 429 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 }); }
  const parsed = submissionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "بيانات غير مكتملة", fields: parsed.error.flatten().fieldErrors }, { status: 422 });
  const v = parsed.data;
  if (v.website) return NextResponse.json({ ref: "MLH-00-0000" }); // honeypot: نتظاهر بالنجاح
  if (!(await captchaOk(v.captchaToken, ip))) return NextResponse.json({ error: "فشل التحقق الأمني" }, { status: 400 });

  if (!supabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    if (process.env.NODE_ENV !== "production") return NextResponse.json({ ref: "MLH-DEV-0000", dev: true });
    return NextResponse.json({ error: "الخدمة غير متاحة مؤقتاً" }, { status: 503 });
  }

  const db = adminClient();
  // منع التكرار 1: نفس مفتاح الإرسال
  const dup = await db.from("leads").select("ref_code").eq("idempotency_key", v.idempotencyKey).maybeSingle();
  if (dup.data) return NextResponse.json({ ref: dup.data.ref_code, duplicate: true });
  // منع التكرار 2: نفس البريد خلال 10 دقائق
  const since = new Date(Date.now() - 10 * 60_000).toISOString();
  const recent = await db.from("leads").select("ref_code").ilike("email", v.email).gt("created_at", since).limit(1).maybeSingle();
  if (recent.data) return NextResponse.json({ ref: recent.data.ref_code, duplicate: true });

  const [svc, plan] = await Promise.all([
    db.from("services").select("id").eq("slug", v.serviceSlug).maybeSingle(),
    v.planSlug ? db.from("plans").select("id").eq("slug", v.planSlug).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const isMinor = v.ageGroup === "under_18";
  const { data: lead, error } = await db.from("leads").insert({
    idempotency_key: v.idempotencyKey,
    full_name: v.fullName, profession: v.profession, country: v.country, phone: v.phone, email: v.email,
    age_group: v.ageGroup, is_minor: isMinor,
    guardian_name: isMinor ? v.guardianName : null, guardian_phone: isMinor ? v.guardianPhone : null, guardian_consent: isMinor && v.guardianConsent,
    service_id: svc.data?.id ?? null, plan_id: plan.data?.id ?? null, session_mode: v.sessionMode,
    goal_text: v.goalText || null, contact_pref: v.contactPref, preferred_slot_id: v.preferredSlotId ?? null,
    preferred_times_text: v.preferredTimesText || null, extra_notes: v.extraNotes || null,
    referral_flag: v.needsSpecialist, priority: v.needsSpecialist || isMinor ? 1 : 2,
    source: v.source || "direct",
  }).select("id,ref_code").single();
  if (error || !lead) { console.error(error); return NextResponse.json({ error: "تعذّر حفظ الطلب" }, { status: 500 }); }

  const scores = Object.fromEntries(SCORE_FIELDS.map((f) => [f.key, (v as any)[f.key]]));
  const ipHash = hashIp(ip);
  const consent = (kind: string, granted: boolean) => ({ lead_id: lead.id, kind, granted, policy_version: POLICY_VERSION, ip_hash: ipHash });
  await Promise.all([
    db.from("form_answer_sets").insert({ lead_id: lead.id, kind: "initial", compare_consent: v.consentCompare, ...scores }),
    db.from("consents").insert([
      consent("privacy", true), consent("share_result", v.consentShareResult), consent("compare_progress", v.consentCompare),
      consent("whatsapp_followup", v.consentWhatsapp), ...(isMinor ? [consent("guardian", v.guardianConsent)] : []),
    ]),
    db.from("notification_events").insert({ kind: "new_lead", lead_id: lead.id, payload: { ref: lead.ref_code, referral: v.needsSpecialist } }),
    db.from("sheets_outbox").insert({ lead_id: lead.id }),
  ]);
  if (sheetsConfigured()) drainOutbox(3).catch(() => {}); // best-effort؛ المهمة المجدولة تعيد المحاولة
  return NextResponse.json({ ref: lead.ref_code });
}
