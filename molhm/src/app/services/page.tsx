import Link from "next/link";
import { PageHead, Wrap } from "@/components/Shell";
import { getSiteData } from "@/lib/data";
export const metadata = { title: "الخدمات" };
export const revalidate = 60;
export default async function Services() {
  const { services } = await getSiteData();
  return (<>
    <PageHead title="الخدمات" lead="اختر المجال الأقرب لاحتياجك، وسنحدّد معك التفاصيل في التواصل الأولي." />
    <Wrap className="grid gap-5 md:grid-cols-2">
      {services.map((s) => (
        <article key={s.slug} className="card"><h2 className="mb-2 text-xl">{s.title_ar}</h2><p className="text-navy-800/80">{s.description_ar}</p>
          {s.subs.length > 0 && <ul className="mt-3 flex flex-wrap gap-2">{s.subs.map((x) => <li key={x} className="rounded-full bg-ivory-200 px-3 py-1 text-sm">{x}</li>)}</ul>}
          <Link href={`/assess?service=${s.slug}`} className="btn-ghost mt-5">اطلب استشارة</Link></article>))}
    </Wrap></>);
}
