"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SCORE_FIELDS, SCALE_INTRO, SCALE_MIN_LABEL, SCALE_MAX_LABEL, scorePreview, type ScoreKey } from "@/lib/scales";
import { AGE_GROUPS } from "@/lib/validation";
import { LifeWheel } from "@/components/LifeWheel";

type Opt = { slug: string; title: string };
type Slot = { id: string; starts_at: string; ends_at: string; mode: string };
const STEPS = ["الخدمة", "بياناتك", "تقييم شخصي لك", "هدفك وتفضيلاتك", "الموعد", "الموافقة"];
const DRAFT = "molhm-draft-v1"; // يحفظ الخدمة والدرجات فقط — لا بيانات تعريفية

export default function Wizard({ services, plans, slots, initialService, initialPlan, siteKey }:
  { services: Opt[]; plans: Opt[]; slots: Slot[]; initialService?: string; initialPlan?: string; siteKey?: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [f, setF] = useState<Record<string, any>>({
    serviceSlug: initialService ?? "", planSlug: initialPlan ?? "", sessionMode: "office", contactPref: "whatsapp",
    needsSpecialist: false, guardianConsent: false, consentPrivacy: false, consentShareResult: false, consentCompare: false, consentWhatsapp: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [serverErr, setServerErr] = useState("");
  const key = useRef("");
  const captcha = useRef("");
  const set = (k: string, v: any) => { setF((p) => ({ ...p, [k]: v })); setErrors((e) => ({ ...e, [k]: "" })); };

  useEffect(() => {
    key.current = crypto.randomUUID().replace(/-/g, "");
    try { const d = JSON.parse(sessionStorage.getItem(DRAFT) || "null"); if (d) setF((p) => ({ ...p, ...d.f })); } catch {}
    if (siteKey) {
      (window as any).onTurnstile = (t: string) => (captcha.current = t);
      const s = document.createElement("script"); s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js"; s.async = true; document.head.appendChild(s);
    }
  }, [siteKey]);
  useEffect(() => {
    const keep: Record<string, any> = { serviceSlug: f.serviceSlug, planSlug: f.planSlug };
    SCORE_FIELDS.forEach((s) => { if (f[s.key]) keep[s.key] = f[s.key]; });
    try { sessionStorage.setItem(DRAFT, JSON.stringify({ f: keep })); } catch {}
  }, [f]);

  const minor = f.ageGroup === "under_18";
  const scoresVals = SCORE_FIELDS.map((s) => f[s.key] ?? 5);

  function validate(i: number) {
    const e: Record<string, string> = {}; const need = (k: string, m: string) => { if (!String(f[k] ?? "").trim()) e[k] = m; };
    if (i === 0) need("serviceSlug", "اختر نوع الخدمة");
    if (i === 1) {
      need("fullName", "الاسم مطلوب"); need("ageGroup", "اختر الفئة العمرية"); need("profession", "مهنتك مطلوبة"); need("country", "البلد مطلوب");
      if (!/^\+?[0-9 ()-]{7,20}$/.test(f.phone ?? "")) e.phone = "أدخل رقماً صحيحاً مع رمز الدولة، مثل +974…";
      if (!/^\S+@\S+\.\S+$/.test(f.email ?? "")) e.email = "بريد إلكتروني غير صحيح";
      if (minor) { need("guardianName", "اسم ولي الأمر مطلوب"); need("guardianPhone", "هاتف ولي الأمر مطلوب"); if (!f.guardianConsent) e.guardianConsent = "موافقة ولي الأمر مطلوبة"; }
    }
    if (i === 2) SCORE_FIELDS.forEach((s) => { if (!f[s.key]) e[s.key] = "اختر درجة من 1 إلى 10"; });
    if (i === 5 && !f.consentPrivacy) e.consentPrivacy = "الموافقة على سياسة الخصوصية مطلوبة";
    setErrors(e); return Object.keys(e).length === 0;
  }
  const next = () => { if (validate(step)) { setStep((s) => s + 1); window.scrollTo({ top: 0, behavior: "smooth" }); } };

  async function submit() {
    if (!validate(5)) return;
    setBusy(true); setServerErr("");
    try {
      const body: Record<string, any> = { ...f, idempotencyKey: key.current, captchaToken: captcha.current || undefined, source: new URLSearchParams(location.search).get("src") || undefined };
      Object.keys(body).forEach((k) => (body[k] === "" || body[k] == null) && delete body[k]);
      const r = await fetch("/api/requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      if (!r.ok) { setServerErr(j.error || "تعذّر الإرسال"); setBusy(false); return; }
      // النتيجة للعميل ضمن جلسة المتصفح فقط وبعد موافقته
      sessionStorage.setItem("molhm-result", JSON.stringify({ ref: j.ref, scores: f.consentShareResult ? scoresVals : null, name: f.fullName }));
      sessionStorage.removeItem(DRAFT);
      router.push("/confirmation");
    } catch { setServerErr("تعذّر الاتصال، حاول مرة أخرى."); setBusy(false); }
  }

  const field = (k: string, label: string, o: { type?: string; hint?: string; ph?: string; dir?: string; auto?: string } = {}) => (
    <div><label className="label" htmlFor={k}>{label}</label>
      <input id={k} className="input" type={o.type ?? "text"} dir={o.dir} autoComplete={o.auto} inputMode={o.type === "tel" ? "tel" : undefined} placeholder={o.ph}
        value={f[k] ?? ""} onChange={(e) => set(k, e.target.value)} aria-invalid={!!errors[k]} aria-describedby={`${k}-m`} />
      <div id={`${k}-m`}>{o.hint && <p className="hint">{o.hint}</p>}{errors[k] && <p className="err" role="alert">{errors[k]}</p>}</div></div>
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6" aria-label={`الخطوة ${step + 1} من ${STEPS.length}`}>
        <div className="mb-2 flex justify-between text-sm font-medium"><span>{STEPS[step]}</span><span>{step + 1} / {STEPS.length}</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-navy-900/10"><div className="h-full bg-gold transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>
      </div>

      <div className="card space-y-5">
        {step === 0 && <>
          <fieldset><legend className="label">نوع الخدمة</legend>
            <div className="grid gap-2">{services.map((s) => (
              <label key={s.slug} className={`flex min-h-[48px] cursor-pointer items-center gap-3 rounded-xl border p-3 ${f.serviceSlug === s.slug ? "border-gold bg-gold/10" : "border-navy-900/15"}`}>
                <input type="radio" name="service" checked={f.serviceSlug === s.slug} onChange={() => set("serviceSlug", s.slug)} />{s.title}</label>))}</div>
            {errors.serviceSlug && <p className="err" role="alert">{errors.serviceSlug}</p>}</fieldset>
          <div><label className="label" htmlFor="plan">الباقة (اختياري)</label>
            <select id="plan" className="input" value={f.planSlug} onChange={(e) => set("planSlug", e.target.value)}><option value="">لم أحدد بعد</option>{plans.map((p) => <option key={p.slug} value={p.slug}>{p.title}</option>)}</select></div>
          <div><label className="label" htmlFor="mode">نمط الجلسة</label>
            <select id="mode" className="input" value={f.sessionMode} onChange={(e) => set("sessionMode", e.target.value)}>
              <option value="office">مكتبية (الدوحة)</option><option value="phone">هاتفية</option><option value="online">أونلاين</option></select></div>
        </>}

        {step === 1 && <>
          <p className="rounded-lg bg-ivory-200 p-3 text-xs text-navy-800">الحقول المعلَّمة «من الاستمارة الأصلية» منقولة من نموذج ملهم الحالي؛ الاسم والفئة العمرية إضافات للنسخة الجديدة.</p>
          {field("fullName", "الاسم الكامل", { auto: "name" })}
          <div><label className="label" htmlFor="ageGroup">الفئة العمرية</label>
            <select id="ageGroup" className="input" value={f.ageGroup ?? ""} onChange={(e) => set("ageGroup", e.target.value)}><option value="">اختر</option>{AGE_GROUPS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
            {errors.ageGroup && <p className="err" role="alert">{errors.ageGroup}</p>}</div>
          {minor && <div className="space-y-4 rounded-xl border border-gold/50 bg-gold/5 p-4">
            <p className="text-sm font-semibold">بما أنك دون 18 عاماً، نحتاج بيانات ولي الأمر وموافقته قبل أي متابعة.</p>
            {field("guardianName", "اسم ولي الأمر")}{field("guardianPhone", "هاتف ولي الأمر", { type: "tel", dir: "ltr" })}
            <label className="flex gap-3"><input type="checkbox" checked={f.guardianConsent} onChange={(e) => set("guardianConsent", e.target.checked)} /><span>أقرّ بأنني ولي أمر مقدّم الطلب وأوافق على تواصل ملهم معه.</span></label>
            {errors.guardianConsent && <p className="err" role="alert">{errors.guardianConsent}</p>}</div>}
          {field("profession", "مهنتك")}
          {field("country", "البلد", { hint: "أين تقيم الآن" })}
          {field("phone", "رقم الهاتف", { type: "tel", dir: "ltr", auto: "tel", hint: "مع فتح الخط الدولي لنتمكن من الوصول إليك.", ph: "+974…" })}
          {field("email", "بريدك الإلكتروني", { type: "email", dir: "ltr", auto: "email" })}
        </>}

        {step === 2 && <>
          <h2 className="text-xl">تقييم شخصي لك</h2>
          <p className="text-sm text-navy-800">{SCALE_INTRO}</p>
          {SCORE_FIELDS.map((s) => (
            <fieldset key={s.key}><legend className="label">{s.label}</legend>
              <div className="flex justify-between text-xs text-navy-700"><span>{SCALE_MIN_LABEL}</span><span>{SCALE_MAX_LABEL}</span></div>
              <div role="radiogroup" aria-label={s.label} className="mt-1 grid grid-cols-5 gap-1.5 sm:grid-cols-10">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <button key={n} type="button" role="radio" aria-checked={f[s.key] === n} onClick={() => set(s.key, n)}
                    className={`min-h-[44px] rounded-lg border text-base font-semibold ${f[s.key] === n ? "border-gold bg-navy-900 text-gold-light" : "border-navy-900/20 bg-white"}`}>{n}</button>))}
              </div>
              {f[s.key] ? <p className="hint" aria-live="polite">{f[s.key]}/10 — {scorePreview(f[s.key])}</p> : null}
              {errors[s.key] && <p className="err" role="alert">{errors[s.key]}</p>}</fieldset>))}
          <div className="border-t pt-4"><p className="mb-2 text-center text-sm font-semibold">معاينة عجلتك الآن</p><LifeWheel values={scoresVals} /></div>
          <p className="text-xs text-navy-700">هذه معاينة لإجاباتك فقط، وليست تشخيصاً أو حكماً، ولا تحدد قبول طلبك.</p>
        </>}

        {step === 3 && <>
          <div><label className="label" htmlFor="goal">ما الذي تودّ العمل عليه؟ (اختياري)</label><textarea id="goal" rows={4} className="input py-3" maxLength={1500} value={f.goalText ?? ""} onChange={(e) => set("goalText", e.target.value)} />
            <p className="hint">اكتب بقدر ما تشاء، ولا داعي لتفاصيل حساسة.</p></div>
          <div><label className="label" htmlFor="cp">وسيلة التواصل المفضّلة</label>
            <select id="cp" className="input" value={f.contactPref} onChange={(e) => set("contactPref", e.target.value)}><option value="whatsapp">واتساب</option><option value="phone">اتصال هاتفي</option><option value="email">بريد إلكتروني</option></select></div>
          <div><label className="label" htmlFor="notes">هل تود بإضافة ملاحظات/طلبات أخرى</label><textarea id="notes" rows={3} className="input py-3" maxLength={2000} value={f.extraNotes ?? ""} onChange={(e) => set("extraNotes", e.target.value)} /></div>
          <label className="flex gap-3 rounded-xl bg-ivory-200 p-3"><input type="checkbox" checked={f.needsSpecialist} onChange={(e) => set("needsSpecialist", e.target.checked)} />
            <span className="text-sm">أشعر أن وضعي قد يحتاج إلى مختص طبي أو نفسي أو دعم عاجل. (ملهم ليست خدمة علاج أو طوارئ؛ في الحالات العاجلة اتصل بـ 999 في قطر.)</span></label>
        </>}

        {step === 4 && <>
          <h2 className="text-xl">تفضيلات الموعد</h2>
          <p className="text-sm text-navy-800">اختيارك طلبٌ مبدئي فقط؛ لا يُحجز الموعد إلا بعد تأكيد الفريق.</p>
          {slots.length > 0 ? <div className="grid gap-2">{slots.map((s) => (
            <label key={s.id} className={`flex min-h-[48px] cursor-pointer items-center gap-3 rounded-xl border p-3 ${f.preferredSlotId === s.id ? "border-gold bg-gold/10" : "border-navy-900/15"}`}>
              <input type="radio" name="slot" checked={f.preferredSlotId === s.id} onChange={() => set("preferredSlotId", s.id)} />
              <span>{new Date(s.starts_at).toLocaleString("ar-QA", { dateStyle: "full", timeStyle: "short", timeZone: "Asia/Qatar" })}</span></label>))}
            <button type="button" className="btn-ghost" onClick={() => set("preferredSlotId", "")}>لا أفضّل موعداً محدداً</button></div>
            : <p className="rounded-xl bg-ivory-200 p-3 text-sm">لا توجد أوقات منشورة حالياً. اكتب أوقاتك المناسبة وسنقترح عليك موعداً.</p>}
          <div><label className="label" htmlFor="pt">أوقات تناسبك (اختياري)</label><input id="pt" className="input" maxLength={300} value={f.preferredTimesText ?? ""} onChange={(e) => set("preferredTimesText", e.target.value)} placeholder="مثال: مساءً بعد الساعة 6" /></div>
        </>}

        {step === 5 && <>
          <h2 className="text-xl">الموافقة والإرسال</h2>
          <label className="flex gap-3"><input type="checkbox" checked={f.consentPrivacy} onChange={(e) => set("consentPrivacy", e.target.checked)} />
            <span>أوافق على <a href="/privacy" target="_blank" className="underline">سياسة الخصوصية</a> ومعالجة بياناتي لمراجعة طلبي والتواصل معي. (إلزامي)</span></label>
          {errors.consentPrivacy && <p className="err" role="alert">{errors.consentPrivacy}</p>}
          <label className="flex gap-3"><input type="checkbox" checked={f.consentShareResult} onChange={(e) => set("consentShareResult", e.target.checked)} /><span>أرغب بعرض نتيجة تقييمي لي بعد الإرسال (ضمن هذه الجلسة فقط). (اختياري)</span></label>
          <label className="flex gap-3"><input type="checkbox" checked={f.consentCompare} onChange={(e) => set("consentCompare", e.target.checked)} /><span>أوافق على مقارنة تقييمي بتقييمات لاحقة لي لمتابعة تقدّمي. (اختياري)</span></label>
          <label className="flex gap-3"><input type="checkbox" checked={f.consentWhatsapp} onChange={(e) => set("consentWhatsapp", e.target.checked)} /><span>أوافق على التواصل معي عبر واتساب بخصوص طلبي. (اختياري)</span></label>
          <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden onChange={(e) => set("website", e.target.value)} />
          {siteKey && <div className="cf-turnstile" data-sitekey={siteKey} data-callback="onTurnstile" />}
          {serverErr && <p className="err" role="alert">{serverErr}</p>}
        </>}

        <div className="flex items-center justify-between gap-3 pt-2">
          {step > 0 ? <button type="button" className="btn-ghost" onClick={() => setStep(step - 1)}>السابق</button> : <span />}
          {step < STEPS.length - 1 ? <button type="button" className="btn-primary" onClick={next}>التالي</button>
            : <button type="button" className="btn-gold" disabled={busy} onClick={submit}>{busy ? "جارٍ الإرسال…" : "إرسال الطلب"}</button>}
        </div>
      </div>
    </div>
  );
}
