import { PageHead, Wrap } from "@/components/Shell";
import { getSiteData } from "@/lib/data";
export const metadata = { title: "متابعة واتساب" };
export const revalidate = 60;
export default async function Whatsapp() {
  const { content: { whatsapp: w } } = await getSiteData();
  return (<>
    <PageHead title="متابعة واتساب" lead="دعم مكتوب بين الجلسات لمساعدتك على الاستمرار في تطبيق خطتك." />
    <Wrap className="grid gap-6 md:grid-cols-2">
      <div className="card"><h2 className="mb-3 text-xl">المدد المتاحة</h2><ul className="space-y-2">{w.durations.map((d) => <li key={d} className="rounded-xl bg-ivory-200 px-4 py-3 font-medium">{d}</li>)}</ul><p className="mt-3 text-sm">الأتعاب: تواصل لمعرفة الأتعاب.</p></div>
      <div className="card ring-gold/40"><h2 className="mb-3 text-xl">الحدود والضوابط</h2><ul className="list-disc space-y-2 pr-5">{w.rules.map((r) => <li key={r}>{r}</li>)}</ul></div>
    </Wrap></>);
}
