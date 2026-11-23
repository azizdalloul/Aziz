import { PageHead, Wrap } from "@/components/Shell";
export const metadata = { title: "الشروط وسياسة المواعيد" };
export default function Terms() {
  return (<>
    <PageHead title="الشروط وسياسة المواعيد" lead="مسودة تُعتمد قبل الإطلاق." />
    <Wrap className="max-w-3xl space-y-6 leading-8">
      <p>الخدمة استشارات وكوتشينج وليست علاجاً نفسياً أو طبياً. لا نضمن نتائج محددة.</p>
      <p>إرسال الاستمارة طلبٌ للمراجعة وليس حجزاً. لا يُعدّ الموعد قائماً إلا بعد تأكيده كتابياً من فريق ملهم.</p>
      <p className="rounded-xl bg-ivory-200 p-4">سياسة الإلغاء وتغيير المواعيد: <strong>تُعتمد من ملهم قبل الإطلاق</strong> (مثلاً: مدة الإشعار المسبق والرسوم إن وُجدت).</p>
    </Wrap></>);
}
