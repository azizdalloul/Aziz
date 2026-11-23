import { z } from "zod";
import { SCORE_FIELDS } from "./scales";

const score = z.number().int().min(1, "اختر درجة من 1 إلى 10").max(10);
const clean = (max: number) => z.string().trim().max(max);

export const POLICY_VERSION = "2026-11-draft";
export const AGE_GROUPS = [
  ["under_18", "أقل من 18"], ["18_24", "18–24"], ["25_34", "25–34"],
  ["35_44", "35–44"], ["45_54", "45–54"], ["55_plus", "55 فأكثر"],
] as const;

export const submissionSchema = z
  .object({
    idempotencyKey: z.string().min(16).max(64),
    serviceSlug: clean(80).min(1, "اختر نوع الخدمة"),
    planSlug: clean(80).optional(),
    sessionMode: z.enum(["office", "phone", "online"]),
    fullName: clean(120).min(2, "الاسم مطلوب"),
    ageGroup: z.enum(AGE_GROUPS.map((a) => a[0]) as [string, ...string[]]),
    // —— حقول الاستمارة الأصلية (إلزامية) ——
    profession: clean(120).min(1, "مهنتك مطلوبة"),
    country: clean(80).min(1, "البلد مطلوب"),
    phone: z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/, "أدخل رقماً صحيحاً مع رمز الدولة، مثل +974…"),
    email: z.string().trim().toLowerCase().email("بريد إلكتروني غير صحيح").max(160),
    ...Object.fromEntries(SCORE_FIELDS.map((f) => [f.key, score])),
    // —— إضافات ليست من النموذج الأصلي ——
    goalText: clean(1500).optional(),
    contactPref: z.enum(["whatsapp", "phone", "email"]).default("whatsapp"),
    preferredSlotId: z.string().uuid().optional(),
    preferredTimesText: clean(300).optional(),
    extraNotes: clean(2000).optional(), // «هل تود بإضافة ملاحظات/طلبات أخرى»
    needsSpecialist: z.boolean().default(false),
    guardianName: clean(120).optional(),
    guardianPhone: clean(30).optional(),
    guardianConsent: z.boolean().default(false),
    consentPrivacy: z.literal(true, { errorMap: () => ({ message: "الموافقة على سياسة الخصوصية مطلوبة" }) }),
    consentShareResult: z.boolean().default(false),
    consentCompare: z.boolean().default(false),
    consentWhatsapp: z.boolean().default(false),
    source: clean(60).optional(),
    captchaToken: z.string().max(2048).optional(),
    website: z.string().max(0).optional(), // honeypot
  })
  .superRefine((v, ctx) => {
    if (v.ageGroup === "under_18") {
      if (!v.guardianName) ctx.addIssue({ code: "custom", path: ["guardianName"], message: "اسم ولي الأمر مطلوب" });
      if (!v.guardianPhone) ctx.addIssue({ code: "custom", path: ["guardianPhone"], message: "هاتف ولي الأمر مطلوب" });
      if (!v.guardianConsent) ctx.addIssue({ code: "custom", path: ["guardianConsent"], message: "موافقة ولي الأمر مطلوبة" });
    }
  });

export type Submission = z.infer<typeof submissionSchema>;
