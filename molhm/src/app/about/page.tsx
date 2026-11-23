import { PageHead, Wrap } from "@/components/Shell";
import { getSiteData } from "@/lib/data";
export const metadata = { title: "عن عبدالعزيز دلول" };
export const revalidate = 60;
export default async function About() {
  const { content: { about } } = await getSiteData();
  return (<>
    <PageHead title={about.name} lead={about.title} />
    <Wrap className="grid gap-8 md:grid-cols-[280px_1fr]">
      {/* موضع صورة حقيقية يزوّدها المالك — لا نستخدم صوراً غير مرخّصة */}
      <div className="flex aspect-[4/5] items-center justify-center rounded-2xl border-2 border-dashed border-gold/50 bg-ivory-200 p-4 text-center text-sm text-navy-700">موضع الصورة الشخصية (يرفعها المالك)</div>
      <div>
        <ul className="space-y-3 text-lg">{about.bullets.map((b) => <li key={b} className="card">{b}</li>)}</ul>
        <h2 className="mt-10 mb-3">الشهادات والاعتمادات</h2>
        <p className="card text-navy-800/80">{about.note}</p>
      </div>
    </Wrap></>);
}
