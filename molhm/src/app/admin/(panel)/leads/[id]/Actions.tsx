"use client";
import { useState, useTransition } from "react";
import { updateLead, addNote, addTask, bookSlot } from "../../../actions";
import { STATUSES } from "@/lib/status";

export default function Actions({ leadId, status, assigned, priority, staff, slots, notes, tasks, bookings }: any) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState(""); const [note, setNote] = useState(""); const [task, setTask] = useState(""); const [due, setDue] = useState(""); const [slot, setSlot] = useState("");
  const run = (fn: () => Promise<any>) => start(async () => { const r = await fn(); setMsg(r?.error ?? "تم الحفظ"); });
  return (
    <aside className="space-y-4" aria-busy={pending}>
      {msg && <p role="status" className="rounded-lg bg-ivory-200 p-2 text-sm">{msg}</p>}
      <div className="card space-y-3"><h2 className="text-lg">الحالة والمسؤول</h2>
        <select className="input" defaultValue={status} onChange={(e) => run(() => updateLead(leadId, { status: e.target.value }))} aria-label="الحالة">{STATUSES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        <select className="input" defaultValue={assigned ?? ""} onChange={(e) => run(() => updateLead(leadId, { assigned_to: e.target.value || null }))} aria-label="المسؤول"><option value="">بدون مسؤول</option>{staff.map((s: any) => <option key={s.id} value={s.id}>{s.full_name}</option>)}</select>
        <select className="input" defaultValue={priority} onChange={(e) => run(() => updateLead(leadId, { priority: Number(e.target.value) }))} aria-label="الأولوية"><option value={1}>أولوية عالية</option><option value={2}>عادية</option><option value={3}>منخفضة</option></select></div>
      <div className="card space-y-3"><h2 className="text-lg">الموعد</h2>
        {bookings.map((b: any, i: number) => <p key={i} className="text-sm">{b.status === "confirmed" ? "مؤكد" : "مقترح"}: {new Date(b.availability_slots.starts_at).toLocaleString("ar-QA", { timeZone: "Asia/Qatar" })}</p>)}
        <select className="input" value={slot} onChange={(e) => setSlot(e.target.value)} aria-label="موعد متاح"><option value="">اختر وقتاً متاحاً</option>{slots.map((s: any) => <option key={s.id} value={s.id}>{new Date(s.starts_at).toLocaleString("ar-QA", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Qatar" })}</option>)}</select>
        <div className="flex gap-2"><button disabled={!slot} className="btn-ghost flex-1" onClick={() => run(() => bookSlot(leadId, slot, false))}>اقتراح</button>
          <button disabled={!slot} className="btn-primary flex-1" onClick={() => confirm("تأكيد الموعد نهائياً؟ سيُحجب عن الآخرين.") && run(() => bookSlot(leadId, slot, true))}>تأكيد</button></div></div>
      <div className="card space-y-3"><h2 className="text-lg">ملاحظة داخلية</h2><textarea className="input py-2" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        <button className="btn-primary w-full" disabled={!note.trim()} onClick={() => run(async () => { await addNote(leadId, note); setNote(""); })}>إضافة</button>
        <ul className="space-y-2 text-sm">{notes.map((n: any, i: number) => <li key={i} className="rounded-lg bg-ivory-200 p-2"><b>{n.profiles?.full_name}</b> · {new Date(n.created_at).toLocaleDateString("ar-QA")}<br />{n.body}</li>)}</ul></div>
      <div className="card space-y-3"><h2 className="text-lg">تذكير بالمتابعة</h2>
        <input className="input" placeholder="العنوان" value={task} onChange={(e) => setTask(e.target.value)} /><input className="input" type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} />
        <button className="btn-ghost w-full" disabled={!task || !due} onClick={() => run(async () => { await addTask(leadId, task, due); setTask(""); })}>إضافة تذكير</button>
        <ul className="text-sm">{tasks.map((t: any, i: number) => <li key={i}>{t.done ? "✓" : "•"} {t.title} — {new Date(t.due_at).toLocaleString("ar-QA")}</li>)}</ul></div>
    </aside>
  );
}
