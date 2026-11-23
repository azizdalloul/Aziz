import { describe, it, expect } from "vitest";
import { submissionSchema } from "@/lib/validation";
import { SCORE_FIELDS } from "@/lib/scales";

const scores = Object.fromEntries(SCORE_FIELDS.map((f) => [f.key, 7]));
const base = {
  idempotencyKey: "a".repeat(32), serviceSlug: "personal-development", sessionMode: "office", fullName: "اسم تجريبي", ageGroup: "25_34",
  profession: "مهندس", country: "قطر", phone: "+97450000000", email: "Demo@Example.com", consentPrivacy: true, ...scores,
};

describe("submission validation (flow)", () => {
  it("accepts a valid request and normalises email", () => {
    const r = submissionSchema.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("demo@example.com");
  });
  it("requires privacy consent", () => {
    expect(submissionSchema.safeParse({ ...base, consentPrivacy: false }).success).toBe(false);
  });
  it("rejects scores outside 1–10 and missing scores", () => {
    expect(submissionSchema.safeParse({ ...base, score_health: 0 }).success).toBe(false);
    expect(submissionSchema.safeParse({ ...base, score_health: 11 }).success).toBe(false);
    const { score_leisure, ...rest } = base as any; void score_leisure;
    expect(submissionSchema.safeParse(rest).success).toBe(false);
  });
  it("requires guardian details for under 18", () => {
    const r = submissionSchema.safeParse({ ...base, ageGroup: "under_18" });
    expect(r.success).toBe(false);
    expect(submissionSchema.safeParse({ ...base, ageGroup: "under_18", guardianName: "ولي", guardianPhone: "+97450000001", guardianConsent: true }).success).toBe(true);
  });
  it("rejects bad phone / email and honeypot content", () => {
    expect(submissionSchema.safeParse({ ...base, phone: "abc" }).success).toBe(false);
    expect(submissionSchema.safeParse({ ...base, email: "x" }).success).toBe(false);
    expect(submissionSchema.safeParse({ ...base, website: "spam" }).success).toBe(false);
  });
});
