import { redirect } from "next/navigation";
import { createClient, supabaseConfigured } from "./supabase/server";

export type Staff = { id: string; full_name: string; role: "admin" | "operations" };

/** يُستدعى في كل صفحة/Route إدارية: يتحقق من الجلسة + وجود ملف الموظف + (اختياري) MFA. */
export async function requireStaff(opts: { adminOnly?: boolean } = {}): Promise<Staff> {
  if (!supabaseConfigured()) redirect("/admin/login");
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: profile } = await sb.from("profiles").select("id,full_name,role").eq("id", user.id).maybeSingle();
  if (!profile) redirect("/admin/login?e=noaccess");
  if (process.env.REQUIRE_MFA === "true") {
    const { data: aal } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel !== "aal2") redirect("/admin/login?e=mfa");
  }
  if (opts.adminOnly && profile.role !== "admin") redirect("/admin");
  return profile as Staff;
}

/** نسخة للـ API: ترجع null بدل redirect. */
export async function staffOrNull(): Promise<Staff | null> {
  if (!supabaseConfigured()) return null;
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb.from("profiles").select("id,full_name,role").eq("id", user.id).maybeSingle();
  if (!data) return null;
  if (process.env.REQUIRE_MFA === "true") {
    const { data: aal } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel !== "aal2") return null;
  }
  return data as Staff;
}
