"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowser } from "@/lib/supabase/browser";
import { STATUSES, STATUS_LABEL } from "@/lib/status";

type L = { id: string; ref_code: string; full_name: string; status: string; created_at: string; referral_flag: boolean; is_minor: boolean; services?: { title_ar: string } | null };

export default function Live({ initial, counts: c0, funnel }: { initial: L[]; counts: Record<string, number>; funnel: Record<string, number> }) {
  const [rows, setRows] = useState<L[]>(initial);
  const [fresh, setFresh] = useState<string | null>(null);
  useEffect(() => {
    const sb = createBrowser();
    const ch = sb.channel("leads-live").on("postgres_changes", { event: "*", schema: "public", table: "leads" }, (p: any) => {
      const n = p.new as L;
      setRows((r) => p.eventType === "INSERT" ? [n, ...r] : p.eventType === "DELETE" ? r.filter((x) => x.id !== p.old.id) : r.map((x) => (x.id === n.id ? { ...x, ...n } : x)));
      if (p.eventType === "INSERT") { setFresh(n.ref_code); setTimeout(() => setFresh(null), 8000); }
    }).subscribe();
    return () => { sb.removeChannel(ch); };
  }, []);
  const counts = Object.fromEntries(STATUSES.map(([k]) => [k, rows.filter((r) => r.status === k).length]));
  void c0;
  const f = { new: rows.length, contacted: rows.filter((l) => !["new", "under_review"].includes(l.status)).length,
    offers: rows.filter((l) => ["slot_proposed", "awaiting_payment", "confirmed", "completed"].includes(l.status)).length,
    confirmed: rows.filter((l) => ["confirmed", "completed"].includes(l.status)).length };
  void funnel;
  return (
    <div className="space-y-6">
      {fresh && <div role="status" className="rounded-xl bg-gold px-4 py-3 font-semibold text-navy-950">طلب جديد: {fresh}</div>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {STATUSES.map(([k, l]) => <Link key={k} href={`/admin/leads?status=${k}`} className="card !p-4"><div className="text-3xl font-bold">{counts[k]}</div><div className="text-sm text-navy-800/80">{l}</div></Link>)}
      </div>
      <div className="card"><h2 className="mb-3 text-lg">مسار التحويل (أعداد فقط)</h2>
        <ol className="grid gap-2 text-center sm:grid-cols-4">
          {[["طلبات جديدة", f.new], ["تم التواصل", f.contacted], ["عروض/جلسات", f.offers], ["حجوزات مؤكدة", f.confirmed]].map(([t, n]) => <li key={t as string} className="rounded-xl bg-ivory-200 p-3"><div className="text-2xl font-bold">{n}</div><div className="text-sm">{t}</div></li>)}</ol></div>
      <div className="card"><h2 className="mb-3 text-lg">أحدث الطلبات</h2>
        <ul className="divide-y">{rows.slice(0, 10).map((l) => (
          <li key={l.id}><Link href={`/admin/leads/${l.id}`} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <span className="font-medium">{l.full_name} <span className="font-mono text-xs text-navy-700" dir="ltr">{l.ref_code}</span>
              {l.referral_flag && <span className="mr-2 rounded bg-red-100 px-2 text-xs text-red-800">مراجعة إحالة</span>}
              {l.is_minor && <span className="mr-2 rounded bg-gold/30 px-2 text-xs">قاصر</span>}</span>
            <span className="text-sm">{l.services?.title_ar ?? "—"} · {STATUS_LABEL[l.status]}</span></Link></li>))}
          {!rows.length && <li className="py-6 text-center text-navy-700">لا طلبات بعد.</li>}</ul></div>
    </div>
  );
}
