import { DEFAULT_CONTENT, DEFAULT_PLANS, DEFAULT_SERVICES, type SiteContent } from "./content";
import { createClient, supabaseConfigured } from "./supabase/server";

export type Plan = (typeof DEFAULT_PLANS)[number];
export type Service = { slug: string; title_ar: string; description_ar: string; subs: string[] };
export type Slot = { id: string; starts_at: string; ends_at: string; mode: string };

/** قراءة المحتوى من DB (CMS) مع رجوع آمن إلى الافتراضي عند غياب الإعداد. */
export async function getSiteData() {
  let content: SiteContent = DEFAULT_CONTENT, plans: Plan[] = DEFAULT_PLANS, services: Service[] = DEFAULT_SERVICES, fromDb = false;
  if (supabaseConfigured()) {
    try {
      const sb = createClient();
      const [c, p, s] = await Promise.all([
        sb.from("site_content").select("key,value"),
        sb.from("plans").select("*").eq("published", true).order("sort"),
        sb.from("services").select("slug,title_ar,description_ar").eq("published", true).order("sort"),
      ]);
      if (c.data?.length) content = { ...DEFAULT_CONTENT, ...Object.fromEntries(c.data.map((r) => [r.key, r.value])) } as SiteContent;
      if (p.data?.length) plans = p.data as unknown as Plan[];
      if (s.data?.length) services = s.data.map((r) => ({ ...r, subs: DEFAULT_SERVICES.find((d) => d.slug === r.slug)?.subs ?? [] }));
      fromDb = true;
    } catch { /* fall back */ }
  }
  return { content, plans, services, fromDb };
}

export async function getOpenSlots(): Promise<Slot[]> {
  if (!supabaseConfigured()) return [];
  try {
    const { data } = await createClient().from("availability_slots").select("id,starts_at,ends_at,mode")
      .eq("is_open", true).gt("starts_at", new Date().toISOString()).order("starts_at").limit(60);
    return (data ?? []) as Slot[];
  } catch { return []; }
}
