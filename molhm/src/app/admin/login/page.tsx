"use client";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { signIn } from "../actions";

export default function Login() {
  const r = useRouter();
  const [s, action] = useFormState(signIn, null as any);
  useEffect(() => { if (s?.ok) { r.replace("/admin"); r.refresh(); } }, [s, r]);
  const e = typeof window !== "undefined" ? new URLSearchParams(location.search).get("e") : null;
  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <form action={action} className="card space-y-4">
        <h1 className="!text-2xl">دخول فريق ملهم</h1>
        {e === "noaccess" && <p className="err">هذا الحساب غير مخوّل.</p>}
        {e === "mfa" && <p className="err">يلزم التحقق بخطوتين (MFA).</p>}
        <div><label className="label" htmlFor="email">البريد</label><input id="email" name="email" type="email" dir="ltr" required className="input" autoComplete="username" /></div>
        <div><label className="label" htmlFor="pw">كلمة المرور</label><input id="pw" name="password" type="password" dir="ltr" required className="input" autoComplete="current-password" /></div>
        {s?.error && <p className="err" role="alert">{s.error}</p>}
        <button className="btn-primary w-full">دخول</button>
      </form>
    </div>
  );
}
