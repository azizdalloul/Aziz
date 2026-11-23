import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const getUser = vi.fn();
vi.mock("@supabase/ssr", () => ({ createServerClient: () => ({ auth: { getUser } }) }));

async function run(path: string) {
  const { updateSession } = await import("@/lib/supabase/middleware");
  return updateSession(new NextRequest(new URL(path, "https://molhm.test")));
}
beforeEach(() => { process.env.NEXT_PUBLIC_SUPABASE_URL = "https://x.supabase.co"; process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon"; getUser.mockReset(); });

describe("admin access control", () => {
  it("redirects anonymous visitors from /admin to login", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const r = await run("/admin/leads");
    expect(r.status).toBe(307); expect(r.headers.get("location")).toContain("/admin/login");
  });
  it("returns 401 JSON for anonymous admin API (export)", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    expect((await run("/api/admin/export")).status).toBe(401);
  });
  it("lets the login page and public pages through", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    expect((await run("/admin/login")).status).toBe(200);
    expect((await run("/")).status).toBe(200);
  });
  it("lets an authenticated session reach /admin (role is enforced by layout + RLS)", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u" } } });
    expect((await run("/admin")).status).toBe(200);
  });
});
