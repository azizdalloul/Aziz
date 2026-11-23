/** البنود السبعة الأصلية من استمارة ملهم — الترتيب والنص كما ظهرا في الصور. */
export const SCORE_FIELDS = [
  { key: "score_health", label: "الجانب الصحي" },
  { key: "score_spiritual", label: "الحالة الروحانية" },
  { key: "score_personal", label: "الجانب الشخصي" },
  { key: "score_social", label: "العلاقات الاجتماعية والأسرة" },
  { key: "score_career", label: "الجانب المهني" },
  { key: "score_education", label: "الجانب التعليمي" },
  { key: "score_leisure", label: "الجانب الترفيهي" },
] as const;

export type ScoreKey = (typeof SCORE_FIELDS)[number]["key"];
export type Scores = Record<ScoreKey, number>;

export const SCALE_INTRO =
  "حدد درجة من 1 (ضعيف) إلى 10 (ممتاز) تعبر فيها عن رضاك لجوانب حياتك الآن لا تفكر كثيراً فقط اختر الرقم.";
export const SCALE_MIN_LABEL = "ضعيف";
export const SCALE_MAX_LABEL = "ممتازة";

/** معاينة وصفية محايدة لكل درجة — ليست حكماً ولا تشخيصاً. */
export function scorePreview(n: number): string {
  if (n <= 3) return "رضاك الحالي منخفض هنا — قد يكون مجالاً تودّ أن نبدأ منه.";
  if (n <= 6) return "رضاك متوسط — هناك مساحة للتحسّن إن كان هذا مهماً لك.";
  if (n <= 8) return "رضاك جيد — جانب يمكن البناء عليه.";
  return "رضاك مرتفع — جانب قوي في حياتك الآن.";
}

export function extremes(scores: Scores) {
  const entries = SCORE_FIELDS.map((f) => ({ ...f, value: scores[f.key] }));
  const lowest = entries.reduce((a, b) => (b.value < a.value ? b : a));
  const highest = entries.reduce((a, b) => (b.value > a.value ? b : a));
  return { lowest, highest };
}

/** نقاط عجلة الحياة: 7 محاور، القيمة 1–10 على نصف قطر 0–R. */
export function wheelPoints(values: number[], cx: number, cy: number, r: number) {
  const n = values.length;
  return values.map((v, i) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    const rr = (Math.max(0, Math.min(10, v)) / 10) * r;
    return { x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr, ax: cx + Math.cos(a) * r, ay: cy + Math.sin(a) * r };
  });
}
