"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { LifeWheel } from "@/components/LifeWheel";
import { SCORE_FIELDS } from "@/lib/scales";
import { BOOKING_STEPS_MESSAGE } from "@/lib/status";
import { WHATSAPP_URL } from "@/lib/content";

export default function Confirmation() {
  const [r, setR] = useState<{ ref: string; scores: number[] | null; name?: string } | null>(null);
  useEffect(() => { try { setR(JSON.parse(sessionStorage.getItem("molhm-result") || "null")); } catch {} }, []);
  const msg = encodeURIComponent(`مرحباً، أرسلت طلب استشارة${r ? ` برقم ${r.ref}` : ""} وأودّ المتابعة.`);
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-12">
      <div className="card text-center">
        <p className="text-sm font-semibold text-gold-dark">تم استلام طلبك</p>
        <h1 className="mt-2 !text-3xl">شكراً{r?.name ? ` ${r.name.split(" ")[0]}` : ""}، طلبك قيد المراجعة</h1>
        {r && <p className="mt-4 text-lg">رقم الطلب: <span className="font-mono font-bold" dir="ltr">{r.ref}</span></p>}
        <p className="mt-4 rounded-xl bg-ivory-200 p-3 text-sm">الحالة: <strong>قيد المراجعة</strong>. لم يتم تأكيد أي موعد بعد؛ سيتواصل معك فريق ملهم لتنسيق الموعد وتأكيده.</p>
      </div>
      <div className="card"><h2 className="mb-2 text-lg">الخطوات القادمة</h2><p className="text-navy-800/90">{BOOKING_STEPS_MESSAGE}</p>
        <a className="btn-gold mt-4" target="_blank" rel="noopener noreferrer" href={`${WHATSAPP_URL}?text=${msg}`}>تابع الاستفسار عبر واتساب</a></div>
      {r?.scores && <div className="card"><h2 className="mb-2 text-lg">إجاباتك — عجلة الحياة</h2><LifeWheel values={r.scores} />
        <ul className="mt-3 grid grid-cols-2 gap-1 text-sm">{SCORE_FIELDS.map((f, i) => <li key={f.key}>{f.label}: <strong>{r.scores![i]}</strong></li>)}</ul>
        <p className="mt-3 text-xs text-navy-700">تعرض هذه الصفحة إجاباتك فقط ضمن جلسة المتصفح هذه، وليست تشخيصاً أو حكماً.</p></div>}
      <div className="text-center"><Link href="/" className="underline">العودة للرئيسية</Link></div>
    </div>
  );
}
