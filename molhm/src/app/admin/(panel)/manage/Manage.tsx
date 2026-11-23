"use client";
import { useState, useTransition } from "react";
import { addSlot, removeSlot, savePlan, saveContent } from "../../actions";
import { DEFAULT_CONTENT } from "@/lib/content";

export default function Manage({ isAdmin, plans, slots, content }: any) {
  const [msg, setMsg] = useState(""); const [pending, start] = useTransition();
  const [when, setWhen] = useState(""); const [mins, setMins] = useState(60);
  const [key, setKey] = useState("hero");
  const cur = content.find((c: any) => c.key === key)?.value ?? (DEFAULT_CONTENT as any)[key];
  const [json, setJson] = useState(JSON.stringify(cur, null, 2));
  const run = (fn: () => Promise<any>) => start(async () => { const r = await fn(); setMsg(r?.error ?? "تم الحفظ"); });
  return (
    <div className="space-y-6" aria-busy={pending}>
      {msg && <p role="status" className="rounded-lg bg-gold/30 p-2 text-sm">{msg}</p>}
      <section className="card space-y-3"><h2 className="text-lg">الأوقات المتاحة</h2>
        <div className="flex flex-wrap gap-2"><input type="datetime-local" className="input !w-auto" value={when} onChange={(e) => setWhen(e.target.value)} />
          <select className="input !w-auto" value={mins} onChange={(e) => setMins(+e.target.value)}><option value={60}>60 د</option><option value={90}>90 د</option></select>
          <button className="btn-primary" disabled={!when} onClick={() => run(() => addSlot(when, mins))}>إضافة وقت</button></div>
        <ul className="grid gap-1 text-sm sm:grid-cols-2">{slots.map((s: any) => <li key={s.id} className="flex justify-between rounded bg-ivory-200 px-3 py-2"><span>{new Date(s.starts_at).toLocaleString("ar-QA", { timeZone: "Asia/Qatar" })} {s.is_open ? "" : "(محجوز)"}</span>
          <button className="text-red-700" onClick={() => run(() => removeSlot(s.id))}>حذف</button></li>)}</ul></section>
      <section className="card space-y-4"><h2 className="text-lg">الباقات والأسعار {isAdmin ? "" : "(للمسؤول فقط)"}</h2>
        <p className="text-sm text-navy-700">السعر لا يظهر للعملاء إلا إذا فعّلت «نشر السعر». وإلا يظهر «تواصل لمعرفة الأتعاب».</p>
        {plans.map((p: any) => <PlanRow key={p.slug} p={p} disabled={!isAdmin} run={run} />)}</section>
      {isAdmin && <section className="card space-y-3"><h2 className="text-lg">محتوى الصفحات (JSON)</h2>
        <select className="input" value={key} onChange={(e) => { setKey(e.target.value); const v = content.find((c: any) => c.key === e.target.value)?.value ?? (DEFAULT_CONTENT as any)[e.target.value]; setJson(JSON.stringify(v, null, 2)); }}>
          {Object.keys(DEFAULT_CONTENT).map((k) => <option key={k}>{k}</option>)}</select>
        <textarea dir="ltr" rows={14} className="input py-2 font-mono text-xs" value={json} onChange={(e) => setJson(e.target.value)} />
        <button className="btn-primary" onClick={() => run(() => saveContent(key, json))}>حفظ المحتوى</button></section>}
    </div>
  );
}

function PlanRow({ p, disabled, run }: any) {
  const [price, setPrice] = useState(p.price_qar ?? ""); const [pub, setPub] = useState(p.price_published);
  const [title, setTitle] = useState(p.title_ar); const [desc, setDesc] = useState(p.description_ar); const [feat, setFeat] = useState((p.features ?? []).join("\n"));
  return (<div className="space-y-2 rounded-xl border border-navy-900/10 p-3">
    <input className="input" value={title} disabled={disabled} onChange={(e) => setTitle(e.target.value)} aria-label="الاسم" />
    <input className="input" value={desc} disabled={disabled} onChange={(e) => setDesc(e.target.value)} aria-label="الوصف" />
    {p.kind === "package" && <textarea className="input py-2" rows={3} value={feat} disabled={disabled} onChange={(e) => setFeat(e.target.value)} aria-label="المزايا (سطر لكل ميزة)" />}
    <div className="flex flex-wrap items-center gap-3"><input className="input !w-40" inputMode="decimal" placeholder="السعر QAR" value={price} disabled={disabled} onChange={(e) => setPrice(e.target.value)} />
      <label className="flex items-center gap-2"><input type="checkbox" checked={pub} disabled={disabled} onChange={(e) => setPub(e.target.checked)} />نشر السعر</label>
      <button className="btn-primary !min-h-[40px]" disabled={disabled} onClick={() => run(() => savePlan(p.slug, String(price), pub, feat, title, desc))}>حفظ</button></div></div>);
}
