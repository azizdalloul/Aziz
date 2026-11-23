import Link from "next/link";
import { BRAND, WHATSAPP_URL } from "@/lib/content";

const NAV = [["/about", "عن عبدالعزيز"], ["/molhm", "ما هي ملهم"], ["/services", "الخدمات"], ["/pricing", "الجلسات والأسعار"], ["/packages", "الباقات"], ["/whatsapp", "متابعة واتساب"]];

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-navy-900/10 bg-ivory/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-lg font-bold text-navy-900">ملهم<span className="text-gold"> ·</span></Link>
        <nav className="hidden gap-5 text-sm font-medium md:flex" aria-label="التنقل الرئيسي">
          {NAV.map(([h, t]) => <Link key={h} href={h} className="hover:text-gold-dark">{t}</Link>)}
        </nav>
        <Link href="/assess" className="btn-primary !min-h-[40px] !px-4 text-sm">ابدأ التقييم</Link>
      </div>
      <nav className="flex gap-4 overflow-x-auto px-4 pb-2 text-sm md:hidden" aria-label="التنقل">
        {NAV.map(([h, t]) => <Link key={h} href={h} className="whitespace-nowrap py-1 text-navy-800">{t}</Link>)}
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-20 bg-navy-900 text-ivory">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div><div className="text-lg font-bold">{BRAND.ar}</div><div className="text-sm text-ivory/70" dir="ltr">{BRAND.en}</div>
          <p className="mt-3 text-sm text-ivory/70">الدوحة، قطر. خدمة استشارات وكوتشينج — ليست علاجاً نفسياً أو طبياً.</p></div>
        <div className="text-sm"><div className="mb-2 font-semibold text-gold-light">روابط</div>
          <ul className="space-y-1"><li><Link href="/privacy">سياسة الخصوصية</Link></li><li><Link href="/terms">الشروط وسياسة المواعيد</Link></li><li><Link href="/assess">طلب استشارة</Link></li></ul></div>
        <div className="text-sm"><div className="mb-2 font-semibold text-gold-light">تواصل</div>
          <a href={WHATSAPP_URL} className="btn-gold !min-h-[44px]" target="_blank" rel="noopener noreferrer">واتساب — هبة، منسقة الحجوزات</a></div>
      </div>
    </footer>
  );
}
