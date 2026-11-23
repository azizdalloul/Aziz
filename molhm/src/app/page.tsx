import Link from "next/link";
import { getSiteData } from "@/lib/data";
import { Wrap } from "@/components/Shell";
import { BOOKING_STEPS_MESSAGE } from "@/lib/status";
export const revalidate = 60;

export default async function Home() {
  const { content: c } = await getSiteData();
  return (
    <>
      <section className="bg-gradient-to-b from-navy-900 to-navy-800 text-ivory">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <p className="mb-4 text-sm font-semibold tracking-wide text-gold-light">ملهم للاستشارات والتطوير</p>
          <h1 className="max-w-3xl">{c.hero.title}</h1>
          <p className="mt-5 max-w-2xl text-lg text-ivory/80">{c.hero.subtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/assess" className="btn-gold">ابدأ التقييم واطلب موعداً</Link>
            <Link href="/services" className="btn border border-ivory/30 text-ivory hover:bg-ivory/10">استكشف الخدمات</Link>
          </div>
        </div>
      </section>
      <Wrap>
        <h2 className="mb-6">لماذا ملهم؟</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {c.why.map((w) => <div key={w.t} className="card"><h3 className="mb-2 text-lg font-bold">{w.t}</h3><p className="text-navy-800/80">{w.d}</p></div>)}
        </div>
      </Wrap>
      <Wrap>
        <h2 className="mb-2">كيف تبدأ؟</h2>
        <p className="mb-6 max-w-2xl text-navy-800/80">{BOOKING_STEPS_MESSAGE}</p>
        <ol className="grid gap-4 md:grid-cols-4">
          {c.steps.map((s, i) => (
            <li key={s.t} className="card"><span className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-gold text-navy-950 font-bold">{i + 1}</span>
              <h3 className="font-bold">{s.t}</h3><p className="mt-1 text-sm text-navy-800/80">{s.d}</p></li>
          ))}
        </ol>
        <div className="mt-8"><Link href="/assess" className="btn-primary">أبدأ الآن — بدون إنشاء حساب</Link></div>
      </Wrap>
    </>
  );
}
