import { createClient } from "@/lib/supabase/server";
import { LifeWheel } from "@/components/LifeWheel";
import { SCORE_FIELDS, extremes, type Scores } from "@/lib/scales";
import Link from "next/link";
export const dynamic = "force-dynamic";

/** Live Result — محمية بـ layout الإدارة + RLS. */
export default async function Results() {
  const { data } = await createClient().from("form_answer_sets").select("*, leads(id,full_name,ref_code)").order("created_at", { ascending: false }).limit(30);
  const rows = data ?? [];
  const avg = SCORE_FIELDS.map((f) => rows.length ? rows.reduce((s: number, r: any) => s + r[f.key], 0) / rows.length : 5);
  return (
    <div className="space-y-6">
      <div className="card"><h1 className="!text-2xl">النتائج الحية</h1><p className="text-sm text-navy-700">أحدث 30 تقييماً — رضا مُبلَّغ عنه ذاتياً، للنقاش فقط وليس معياراً للقبول.</p>
        <div className="mt-4"><p className="mb-1 text-sm font-semibold">متوسط المحاور (للاتجاه العام)</p><LifeWheel values={avg} size={280} /></div></div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{rows.map((r: any) => { const e = extremes(r as Scores);
        return <Link key={r.id} href={`/admin/leads/${r.lead_id}`} className="card"><div className="font-semibold">{r.leads?.full_name}</div><div className="font-mono text-xs" dir="ltr">{r.leads?.ref_code}</div>
          <LifeWheel size={220} values={SCORE_FIELDS.map((f) => r[f.key])} /><p className="text-xs">الأدنى: {e.lowest.label} ({e.lowest.value}) · الأعلى: {e.highest.label} ({e.highest.value})</p></Link>; })}
        {!rows.length && <p>لا بيانات.</p>}</div>
    </div>
  );
}
