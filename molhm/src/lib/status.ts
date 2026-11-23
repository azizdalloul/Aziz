export const STATUSES = [
  ["new", "جديد"],
  ["under_review", "قيد المراجعة"],
  ["awaiting_contact", "بانتظار التواصل"],
  ["slot_proposed", "موعد مقترح"],
  ["awaiting_payment", "بانتظار الدفع"],
  ["confirmed", "مؤكد"],
  ["completed", "مكتمل"],
  ["closed", "مغلق"],
  ["not_suitable", "غير ملائم للخدمة"],
] as const;
export type LeadStatus = (typeof STATUSES)[number][0];
export const STATUS_LABEL: Record<string, string> = Object.fromEntries(STATUSES);
export const PRIORITY_LABEL: Record<number, string> = { 1: "عالية", 2: "عادية", 3: "منخفضة" };

/** رسالة العميل: لا يُقال «تم حجز الموعد» إلا في حالة confirmed. */
export function clientStatusMessage(status: string): string {
  switch (status) {
    case "confirmed": return "تم تأكيد موعدك من فريق ملهم.";
    case "slot_proposed": return "اقترح الفريق موعداً وبانتظار تأكيدك.";
    case "awaiting_payment": return "بانتظار إتمام ترتيبات الدفع لتأكيد الموعد.";
    case "not_suitable": return "نشكرك على ثقتك. سيتواصل معك الفريق لتوجيهك إلى الخيار الأنسب.";
    default: return "طلبك قيد المراجعة. لم يتم تأكيد أي موعد بعد.";
  }
}

export const BOOKING_STEPS_MESSAGE =
  "تفضّل/ي بخطوات حجز موعد استشارة مع الأستاذ عبدالعزيز دلول: تعبئة الاستمارة، ثم تواصل أولي لتحديد موضوع الاستشارة، ثم تنسيق الموعد وتأكيده.";
