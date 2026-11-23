import { PageHead, Wrap } from "@/components/Shell";
import { WHATSAPP_URL } from "@/lib/content";
export const metadata = { title: "سياسة الخصوصية" };
export default function Privacy() {
  return (<>
    <PageHead title="سياسة الخصوصية والموافقة" lead="مسودة تُراجَع قانونياً وتُعتمد قبل الإطلاق." />
    <Wrap className="prose-lg max-w-3xl space-y-6 leading-8">
      <section><h2 className="mb-2 text-xl">ما الذي نجمعه؟</h2><p>الاسم، وسيلة التواصل، المهنة والبلد، درجات التقييم الذاتي السبع، هدفك وتفضيلاتك. نطلب الحد الأدنى فقط، ولا نطلب تاريخاً مرضياً أو تفاصيل حساسة.</p></section>
      <section><h2 className="mb-2 text-xl">كيف نستخدمها؟</h2><p>لمراجعة طلبك والتواصل معك وتنسيق الموعد. لا يُتخذ أي قرار قبول أو رفض آلي بناءً على الدرجات.</p></section>
      <section><h2 className="mb-2 text-xl">من يراها؟</h2><p>عبدالعزيز دلول وهبة (منسقة الحجوزات) فقط عبر نظام محمي. يُزامَن جدول تشغيلي محدود (الاسم، التواصل، الخدمة، الحالة) مع ملف مقيّد الصلاحيات.</p></section>
      <section><h2 className="mb-2 text-xl">حقوقك</h2><p>يمكنك في أي وقت سحب موافقتك أو طلب الوصول إلى بياناتك أو تصحيحها أو حذفها، عبر <a className="underline" href={WHATSAPP_URL}>واتساب</a> مع ذكر رقم طلبك.</p></section>
      <section><h2 className="mb-2 text-xl">الاحتفاظ</h2><p>تُحذف الطلبات غير المتابعة بعد فترة يحددها الفريق (مقترح: 12 شهراً) ما لم تطلب الاحتفاظ بها.</p></section>
      <section><h2 className="mb-2 text-xl">أقل من 18 عاماً</h2><p>تلزم موافقة ولي الأمر قبل أي متابعة.</p></section>
    </Wrap></>);
}
