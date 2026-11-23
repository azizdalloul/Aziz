import "server-only";
import { createClient } from "@supabase/supabase-js";
/** مفتاح service role — خادمي فقط، لا يُستورد في أي مكوّن عميل. */
export function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service role not configured");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
