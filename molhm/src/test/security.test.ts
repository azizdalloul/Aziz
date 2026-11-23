import { describe, it, expect, beforeEach } from "vitest";
import { rateLimit, _resetRateLimit } from "@/lib/ratelimit";
import { toCsv } from "@/lib/csv";
import { clientStatusMessage } from "@/lib/status";
import { readFileSync } from "fs";
import { join } from "path";

describe("duplicate / abuse protection", () => {
  beforeEach(_resetRateLimit);
  it("blocks the 6th submit within the window and recovers after", () => {
    const t = 1_000_000;
    for (let i = 0; i < 5; i++) expect(rateLimit("ip", 5, 60_000, t + i)).toBe(true);
    expect(rateLimit("ip", 5, 60_000, t + 10)).toBe(false);
    expect(rateLimit("ip", 5, 60_000, t + 61_000)).toBe(true);
  });
  it("isolates keys", () => { rateLimit("a", 1, 1000, 0); expect(rateLimit("b", 1, 1000, 0)).toBe(true); });
});

describe("export safety", () => {
  it("neutralises CSV formula injection and keeps Arabic BOM", () => {
    const csv = toCsv(["الاسم"], [["=HYPERLINK(\"x\")"], ["+1"], ['a"b']]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
    expect(csv).toContain(`"'+1"`);
    expect(csv).toContain(`"a""b"`);
  });
});

describe("client messaging", () => {
  it("never says the appointment is booked unless confirmed", () => {
    for (const s of ["new", "under_review", "awaiting_contact", "slot_proposed", "awaiting_payment", "closed", "not_suitable"])
      expect(clientStatusMessage(s)).not.toMatch(/تم (تأكيد|حجز) موعدك/);
    expect(clientStatusMessage("confirmed")).toMatch(/تم تأكيد موعدك/);
  });
});

describe("database policy guarantees (static checks on SQL)", () => {
  const sql = readFileSync(join(__dirname, "../../supabase/migrations/0001_schema.sql"), "utf8");
  const rls = readFileSync(join(__dirname, "../../supabase/migrations/0002_rls.sql"), "utf8");
  it("has a unique partial index preventing double booking", () => expect(sql).toMatch(/unique index bookings_one_active_per_slot[\s\S]*where status in \('proposed','confirmed'\)/));
  it("enables RLS on every client-data table and gives anon no access to leads", () => {
    for (const t of ["leads", "form_answer_sets", "consents", "notes", "bookings", "audit_logs", "sheets_outbox"]) expect(rls).toContain(`alter table ${t} enable row level security`);
    expect(rls).not.toMatch(/on leads for (insert|all|select)[^;]*using \(true\)/);
    expect(rls).not.toMatch(/policy [a-z_]+ on (leads|form_answer_sets|consents) [^;]*to anon/);
  });
  it("stores the 7 scores as separate 1–10 columns", () => {
    for (const c of ["health", "spiritual", "personal", "social", "career", "education", "leisure"]) expect(sql).toContain(`score_${c} smallint not null check (score_${c} between 1 and 10)`);
  });
  it("blocks publishing a price without a value", () => expect(sql).toContain("check (not price_published or price_qar is not null)"));
});
