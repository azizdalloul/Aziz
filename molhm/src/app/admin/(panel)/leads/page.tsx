import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { STATUSES, STATUS_LABEL, PRIORITY_LABEL } from "@/lib/status";

export default async function Leads({ searchParams }: { searchParams: { q?: string; status?: string; range?: string } }) {
  const sb = createClient();
  let q = sb.from("leads").select("id,ref_code,full_name,created_at,status,priority,source,last_followup_at,services(title_ar),plans(title_ar),profiles:assigned_to(full_name)").order("created_at", { ascending: false }).limit(300);
  if (searchParams.status) q = q.eq("status", searchParams.status);
  if (searchParams.q) { const s = searchParams.q.replace(/[%,()]/g, ""); q = q.or(`full_name.ilike.%${s}%,ref_code.ilike.%${s}%,email.ilike.%${s}%`); }
  const days = { day: 1, week: 7, month: 30 }[searchParams.range ?? ""];
  if (days) q = q.gte("created_at", new Date(Date.now() - days * 864e5).toISOString());
  const { data } = await q;
  return (
    <div className="space-y-4">
      <form className="card flex flex-wrap items-end gap-3">
        <div><label className="label" htmlFor="q">بحث</label><input id="q" name="q" defaultValue={searchParams.q} className="input" placeholder="الاسم / الرقم / البريد" /></div>
        <div><label className="label" htmlFor="s">الحالة</label><select id="s" name="status" defaultValue={searchParams.status ?? ""} className="input"><option value="">الكل</option>{STATUSES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
        <div><label className="label" htmlFor="r">الفترة</label><select id="r" name="range" defaultValue={searchParams.range ?? ""} className="input"><option value="">الكل</option><option value="day">اليوم</option><option value="week">أسبوع</option><option value="month">شهر</option></select></div>
        <button className="btn-primary">تصفية</button>
        <a href="/api/admin/export" className="btn-ghost">تصدير CSV</a>
        <a href="/api/admin/export?scores=1" className="btn-ghost">CSV مع الدرجات</a>
      </form>
      <div className="card overflow-x-auto !p-0"><table className="w-full min-w-[820px] text-sm">
        <thead className="bg-ivory-200 text-right"><tr>{["الاسم", "التاريخ", "الخدمة", "الباقة", "المصدر", "الحالة", "الأولوية", "آخر متابعة", "المسؤول"].map((h) => <th key={h} className="p-3 font-semibold">{h}</th>)}</tr></thead>
        <tbody>{(data ?? []).map((l: any) => (
          <tr key={l.id} className="border-t hover:bg-ivory/60">
            <td className="p-3"><Link className="font-semibold underline" href={`/admin/leads/${l.id}`}>{l.full_name}</Link><div className="font-mono text-xs" dir="ltr">{l.ref_code}</div></td>
            <td className="p-3">{new Date(l.created_at).toLocaleDateString("ar-QA")}</td><td className="p-3">{l.services?.title_ar ?? "—"}</td><td className="p-3">{l.plans?.title_ar ?? "—"}</td>
            <td className="p-3">{l.source}</td><td className="p-3">{STATUS_LABEL[l.status]}</td><td className="p-3">{PRIORITY_LABEL[l.priority]}</td>
            <td className="p-3">{l.last_followup_at ? new Date(l.last_followup_at).toLocaleDateString("ar-QA") : "—"}</td><td className="p-3">{l.profiles?.full_name ?? "—"}</td></tr>))}
          {!data?.length && <tr><td colSpan={9} className="p-8 text-center">لا نتائج.</td></tr>}</tbody></table></div>
    </div>
  );
}
