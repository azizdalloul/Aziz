import Link from "next/link";
import { PageHead, Wrap } from "@/components/Shell";
import { getSiteData } from "@/lib/data";
import { priceLabel } from "@/lib/content";
export const metadata = { title: "الباقات" };
export const revalidate = 60;
export default async function Packages() {
  const { plans } = await getSiteData();
  const pk = plans.filter((p) => p.kind === "package");
  return (<>
    <PageHead title="الباقات" lead="مسارات من 4 إلى 10 جلسات لمن يريد عملاً أعمق ومتابعة منتظمة." />
    <Wrap className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {pk.map((p) => (
        <div key={p.slug} className="card flex flex-col"><h2 className="text-xl">{p.title_ar}</h2><p className="mt-1 text-sm text-navy-800/80">{p.description_ar}</p>
          <ul className="my-4 list-disc space-y-1 pr-5 text-sm">{(p.features as string[]).map((f) => <li key={f}>{f}</li>)}</ul>
          <p className="mt-auto text-lg font-bold text-gold-dark">{priceLabel(p)}</p>
          <Link href={`/assess?plan=${p.slug}`} className="btn-ghost mt-4">اختر هذه الباقة</Link></div>))}
    </Wrap></>);
}
