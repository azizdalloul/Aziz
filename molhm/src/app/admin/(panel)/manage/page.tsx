import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import Manage from "./Manage";
export const dynamic = "force-dynamic";

export default async function ManagePage() {
  const me = await requireStaff(); const sb = createClient();
  const [plans, slots, content] = await Promise.all([
    sb.from("plans").select("slug,title_ar,description_ar,price_qar,price_published,features,kind").order("sort"),
    sb.from("availability_slots").select("id,starts_at,is_open").gt("starts_at", new Date().toISOString()).order("starts_at").limit(100),
    sb.from("site_content").select("key,value"),
  ]);
  return <Manage isAdmin={me.role === "admin"} plans={(plans.data ?? []) as any} slots={(slots.data ?? []) as any} content={(content.data ?? []) as any} />;
}
