import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LifeWheel } from "@/components/LifeWheel";
import { SCORE_FIELDS, extremes, type Scores } from "@/lib/scales";
import { STATUS_LABEL } from "@/lib/status";
import Actions from "./Actions";

export default async function LeadPage({ params }: { params: { id: string } }) {
  const sb = createClient();
  const { data: l } = await sb.from("leads").select("*, services(title_ar), plans(title_ar)").eq("id", params.id).maybeSingle();
  if (!l) notFound();
  const [sets, notes, hist, tasks, staff, slots, bookings, consents] = await Promise.all([
    sb.from("form_answer_sets").select("*").eq("lead_id", l.id).order("created_at"),
    sb.from("notes").select("body,created_at,profiles(full_name)").eq("lead_id", l.id).order("created_at", { ascending: false }),
    sb.from("booking_status_history").select("from_status,to_status,created_at,profiles(full_name)").eq("lead_id", l.id).order("created_at", { ascending: false }),
    sb.from("followup_tasks").select("title,due_at,done").eq("lead_id", l.id).order("due_at"),
    sb.from("profiles").select("id,full_name"),
    sb.from("availability_slots").select("id,starts_at").eq("is_open", true).gt("starts_at", new Date().toISOString()).order("starts_at").limit(50),
    sb.from("bookings").select("status,availability_slots(starts_at)").eq("lead_id", l.id).in("status", ["proposed", "confirmed"]),
    sb.from("consents").select("kind,granted,created_at").eq("lead_id", l.id),
  ]);
  const last = sets.data?.at(-1) as (Scores & { created_at: string }) | undefined;
  const vals = last ? SCORE_FIELDS.map((f) => last[f.key]) : null;
  const ex = last ? extremes(last) : null;
  const Row = ({ k, v }: { k: string; v?: string | null }) => <div className="flex justify-between gap-4 border-b py-2 text-sm"><span className="text-navy-700">{k}</span><span className="font-medium">{v || "—"}</span></div>;
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <div className="card"><div className="flex flex-wrap items-center justify-between gap-2"><h1 className="!text-2xl">{l.full_name}</h1><span className="font-mono text-sm" dir="ltr">{l.ref_code}</span></div>
          {l.referral_flag && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-900">العميل أشار إلى احتمال حاجته لمختص/دعم عاجل — يُراجَع يدوياً وتُدرَس الإحالة. لا قرار آلي.</p>}
          {l.is_minor && <p className="mt-3 rounded-lg bg-gold/20 p-3 text-sm">قاصر — ولي الأمر: {l.guardian_name} ({l.guardian_phone}) · الموافقة: {l.guardian_consent ? "نعم" : "لا"}</p>}
          <div className="mt-4"><Row k="الحالة" v={STATUS_LABEL[l.status]} /><Row k="الخدمة" v={l.services?.title_ar} /><Row k="الباقة" v={l.plans?.title_ar} /><Row k="نمط الجلسة" v={l.session_mode} />
            <Row k="الهاتف" v={l.phone} /><Row k="البريد" v={l.email} /><Row k="البلد" v={l.country} /><Row k="المهنة" v={l.profession} /><Row k="الفئة العمرية" v={l.age_group} />
            <Row k="وسيلة التواصل" v={l.contact_pref} /><Row k="أوقات مفضلة" v={l.preferred_times_text} /><Row k="المصدر" v={l.source} /></div></div>
        <div className="card"><h2 className="mb-2 text-lg">ملخص الاحتياج والهدف</h2><p className="mb-1 text-sm font-semibold">كما صاغه العميل:</p><p className="whitespace-pre-wrap">{l.goal_text || "لم يكتب هدفاً."}</p>
          <p className="mt-4 mb-1 text-sm font-semibold">ملاحظات/طلبات أخرى:</p><p className="whitespace-pre-wrap">{l.extra_notes || "—"}</p></div>
        <div className="card"><h2 className="mb-2 text-lg">التقييم الذاتي (رضا مُبلَّغ عنه ذاتياً)</h2>
          {vals && ex ? <div className="grid items-center gap-4 md:grid-cols-2"><LifeWheel values={vals} compare={sets.data && sets.data.length > 1 ? SCORE_FIELDS.map((f) => (sets.data![0] as any)[f.key]) : undefined} />
            <div className="space-y-2">{SCORE_FIELDS.map((f, i) => <div key={f.key} className="text-sm"><div className="flex justify-between"><span>{f.label}</span><b>{vals[i]}/10</b></div>
              <div className="h-2 rounded bg-navy-900/10"><div className="h-2 rounded bg-gold" style={{ width: `${vals[i] * 10}%` }} /></div></div>)}
              <p className="pt-2 text-sm">الأدنى رضاً: <b>{ex.lowest.label}</b> ({ex.lowest.value}) · الأعلى: <b>{ex.highest.label}</b> ({ex.highest.value})</p>
              <p className="text-xs text-navy-700">للمناقشة فقط — ليست تشخيصاً ولا تحدد قبول العميل. {sets.data && sets.data.length > 1 ? "الخط المنقّط = التقييم الأول." : ""}</p></div></div> : <p>لا تقييم.</p>}</div>
        <div className="card"><h2 className="mb-2 text-lg">سجل التغييرات (Audit Trail)</h2><ul className="space-y-1 text-sm">{(hist.data ?? []).map((h: any, i) => <li key={i}>{new Date(h.created_at).toLocaleString("ar-QA")} — {STATUS_LABEL[h.from_status] ?? "—"} ← {STATUS_LABEL[h.to_status]} ({h.profiles?.full_name ?? "نظام"})</li>)}</ul>
          <h3 className="mt-4 text-sm font-semibold">الموافقات</h3><ul className="text-sm">{(consents.data ?? []).map((c, i) => <li key={i}>{c.kind}: {c.granted ? "نعم" : "لا"}</li>)}</ul></div>
      </div>
      <Actions leadId={l.id} status={l.status} assigned={l.assigned_to} priority={l.priority} staff={staff.data ?? []} slots={slots.data ?? []}
        notes={(notes.data ?? []) as any} tasks={(tasks.data ?? []) as any} bookings={(bookings.data ?? []) as any} />
    </div>
  );
}
