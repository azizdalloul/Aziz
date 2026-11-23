import { getOpenSlots, getSiteData } from "@/lib/data";
import Wizard from "./Wizard";
import { PageHead } from "@/components/Shell";
export const metadata = { title: "طلب استشارة" };
export const dynamic = "force-dynamic";

export default async function Assess({ searchParams }: { searchParams: { service?: string; plan?: string } }) {
  const [{ services, plans }, slots] = await Promise.all([getSiteData(), getOpenSlots()]);
  return (<>
    <PageHead title="طلب استشارة" lead="عدة خطوات قصيرة. لا حاجة لإنشاء حساب، وإرسال الطلب لا يعني تأكيد الموعد." />
    <Wizard
      services={services.map((s) => ({ slug: s.slug, title: s.title_ar }))}
      plans={plans.map((p) => ({ slug: p.slug, title: p.title_ar }))}
      slots={slots}
      initialService={searchParams.service} initialPlan={searchParams.plan}
      siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
    />
  </>);
}
