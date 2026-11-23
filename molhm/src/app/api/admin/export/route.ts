import { NextResponse } from "next/server";
import { staffOrNull } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { toCsv } from "@/lib/csv";
import { SCORE_FIELDS } from "@/lib/scales";
import { STATUS_LABEL, PRIORITY_LABEL } from "@/lib/status";
import { audit } from "@/lib/audit";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const staff = await staffOrNull();
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const withScores = new URL(req.url).searchParams.get("scores") === "1";
  const sb = createClient(); // RLS يطبَّق بجلسة المستخدم
  const { data, error } = await sb.from("leads")
    .select("*, services(title_ar), plans(title_ar), form_answer_sets(created_at,"+SCORE_FIELDS.map(f=>f.key).join(",")+")")
    .order("created_at", { ascending: false }).limit(5000);
  if (error) return NextResponse.json({ error: "failed" }, { status: 500 });
  const headers = ["رقم الطلب","الاسم","الهاتف","البريد","البلد","المهنة","الخدمة","الباقة","الحالة","الأولوية","تاريخ الطلب","آخر متابعة",
    ...(withScores ? SCORE_FIELDS.map((f) => f.label) : [])];
  const rows = (data ?? []).map((l: any) => {
    const last = [...(l.form_answer_sets ?? [])].sort((a: any, b: any) => b.created_at.localeCompare(a.created_at))[0];
    return [l.ref_code, l.full_name, l.phone, l.email, l.country, l.profession, l.services?.title_ar, l.plans?.title_ar,
      STATUS_LABEL[l.status], PRIORITY_LABEL[l.priority], l.created_at, l.last_followup_at,
      ...(withScores ? SCORE_FIELDS.map((f) => last?.[f.key] ?? "") : [])];
  });
  await audit(staff.id, "export_csv", "leads", undefined, { count: rows.length, withScores });
  return new NextResponse(toCsv(headers, rows), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="molhm-leads-${new Date().toISOString().slice(0,10)}.csv"`, "Cache-Control": "no-store" },
  });
}
