import { createClient } from "@/lib/supabase/server";
import Live from "./Live";
import { STATUSES } from "@/lib/status";

export default async function Dashboard() {
  const sb = createClient();
  const { data } = await sb.from("leads").select("id,ref_code,full_name,status,created_at,referral_flag,is_minor,services(title_ar)").order("created_at", { ascending: false }).limit(200);
  const counts = Object.fromEntries(STATUSES.map(([k]) => [k, 0])) as Record<string, number>;
  (data ?? []).forEach((l: any) => (counts[l.status] = (counts[l.status] ?? 0) + 1));
  const funnel = {
    new: (data ?? []).length,
    contacted: (data ?? []).filter((l: any) => !["new", "under_review"].includes(l.status)).length,
    offers: (data ?? []).filter((l: any) => ["slot_proposed", "awaiting_payment", "confirmed", "completed"].includes(l.status)).length,
    confirmed: (data ?? []).filter((l: any) => ["confirmed", "completed"].includes(l.status)).length,
  };
  return <Live initial={(data ?? []) as any} counts={counts} funnel={funnel} />;
}
