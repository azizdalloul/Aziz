import { describe, it, expect, vi, beforeEach } from "vitest";
import { SCORE_FIELDS } from "@/lib/scales";

const inserted: Record<string, any[]> = {};
let existingByKey: any = null;
function table(name: string) {
  const q: any = {
    select: () => q, ilike: () => q, gt: () => q, eq: () => q, limit: () => q,
    maybeSingle: async () => ({ data: name === "leads" ? existingByKey : { id: "svc-1" } }),
    single: async () => ({ data: { id: "lead-1", ref_code: "MLH-26-1001" }, error: null }),
    insert: (v: any) => { (inserted[name] ??= []).push(v); return q; },
    then: (r: any) => r({ data: null, error: null }),
  };
  return q;
}
vi.mock("@/lib/supabase/admin", () => ({ adminClient: () => ({ from: table }) }));
vi.mock("@/lib/sheets", () => ({ drainOutbox: async () => ({}), sheetsConfigured: () => false }));

const scores = Object.fromEntries(SCORE_FIELDS.map((f) => [f.key, 6]));
const body = (o: object = {}) => ({
  idempotencyKey: "k".repeat(32), serviceSlug: "personal-development", sessionMode: "office", fullName: "تجريبي", ageGroup: "25_34",
  profession: "م", country: "قطر", phone: "+97450000000", email: "t@example.com", consentPrivacy: true, ...scores, ...o });
const post = async (b: object, ip = "1.1.1.1") => {
  const { POST } = await import("@/app/api/requests/route");
  return POST(new Request("http://x/api/requests", { method: "POST", headers: { "x-forwarded-for": ip }, body: JSON.stringify(b) }));
};

beforeEach(async () => {
  for (const k in inserted) delete inserted[k];
  existingByKey = null;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://x.supabase.co"; process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "a"; process.env.SUPABASE_SERVICE_ROLE_KEY = "s";
  (await import("@/lib/ratelimit"))._resetRateLimit();
});

describe("POST /api/requests", () => {
  it("creates a lead with status new (default), 7 scores and consents; returns a ref", async () => {
    const res = await post(body());
    expect(res.status).toBe(200); expect((await res.json()).ref).toBe("MLH-26-1001");
    expect(inserted.leads[0].status).toBeUndefined(); // DB default 'new' — never 'confirmed'
    expect(inserted.form_answer_sets[0].score_health).toBe(6);
    expect(inserted.consents[0].some((c: any) => c.kind === "privacy" && c.granted)).toBe(true);
    expect(inserted.sheets_outbox).toHaveLength(1);
  });
  it("is idempotent: same key returns the existing ref without a second insert", async () => {
    existingByKey = { ref_code: "MLH-26-1000" };
    const j = await (await post(body())).json();
    expect(j).toMatchObject({ ref: "MLH-26-1000", duplicate: true }); expect(inserted.leads).toBeUndefined();
  });
  it("rejects invalid payloads with 422", async () => { expect((await post(body({ consentPrivacy: false }))).status).toBe(422); });
  it("rate-limits repeated submissions from one IP", async () => {
    const codes: number[] = []; for (let i = 0; i < 7; i++) codes.push((await post(body({ idempotencyKey: String(i).repeat(20) }), "9.9.9.9")).status);
    expect(codes.at(-1)).toBe(429);
  });
  it("silently drops honeypot bots without inserting", async () => {
    // honeypot value fails schema max(0) → 422, nothing stored
    const r = await post(body({ website: "bot" })); expect(r.status).toBe(422); expect(inserted.leads).toBeUndefined();
  });
});
