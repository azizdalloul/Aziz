import Link from "next/link";
import { PageHead, Wrap } from "@/components/Shell";
import { getSiteData } from "@/lib/data";
import { priceLabel } from "@/lib/content";
export const metadata = { title: "الجلسات والأسعار" };
export const revalidate = 60;
export default async function Pricing() {
  const { plans } = await getSiteData();
  const sessions = plans.filter((p) => p.kind === "session");
  return (<>
    <PageHead title="الجلسات والأسعار" lead="الجلسات المكتبية الوجاهية في الدوحة. أسعار الجلسات الهاتفية والأونلاين تُحدَّد عند التواصل." />
    <Wrap className="grid gap-5 md:grid-cols-2">
      {sessions.map((p) => (
        <div key={p.slug} className="card"><h2 className="text-xl">{p.title_ar}</h2><p className="mt-1 text-navy-800/80">{p.description_ar}</p>
          <p className="mt-5 text-3xl font-bold text-gold-dark">{priceLabel(p)}</p></div>))}
      <div className="card md:col-span-2"><h2 className="text-xl">جلسات هاتفية / أونلاين</h2><p className="mt-1 text-navy-800/80">تواصل لمعرفة الأتعاب.</p>
        <Link href="/assess" className="btn-primary mt-4">اطلب استشارة</Link></div>
    </Wrap></>);
}
