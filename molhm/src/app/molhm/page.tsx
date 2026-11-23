import { PageHead, Wrap } from "@/components/Shell";
import { getSiteData } from "@/lib/data";
export const metadata = { title: "ما هي ملهم" };
export const revalidate = 60;
export default async function Molhm() {
  const { content: { molhm: m } } = await getSiteData();
  return (<>
    <PageHead title="ما هي ملهم؟" lead={m.philosophy} />
    <Wrap className="grid gap-6 md:grid-cols-3">
      <div className="card"><h2 className="mb-3 text-xl">الخصوصية</h2><p>{m.privacy}</p></div>
      <div className="card"><h2 className="mb-3 text-xl">ما الذي تعمل عليه؟</h2><ul className="list-disc space-y-1 pr-5">{m.outcomes.map((o) => <li key={o}>{o}</li>)}</ul></div>
      <div className="card ring-gold/40"><h2 className="mb-3 text-xl">حدود الخدمة</h2><ul className="list-disc space-y-1 pr-5">{m.limits.map((o) => <li key={o}>{o}</li>)}</ul></div>
    </Wrap></>);
}
