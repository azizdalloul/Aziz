import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { signOut } from "../actions";
export const dynamic = "force-dynamic";

export default async function Panel({ children }: { children: React.ReactNode }) {
  const me = await requireStaff();
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-navy-900 px-5 py-3 text-ivory">
        <nav className="flex flex-wrap gap-4 text-sm font-medium">
          <Link href="/admin">اللوحة</Link><Link href="/admin/leads">الطلبات</Link><Link href="/admin/results">النتائج الحية</Link><Link href="/admin/manage">الإدارة</Link>
        </nav>
        <form action={signOut} className="flex items-center gap-3 text-sm"><span>{me.full_name} · {me.role === "admin" ? "Admin" : "Operations"}</span>
          <button className="rounded-full border border-ivory/30 px-3 py-1">خروج</button></form>
      </div>
      {children}
    </div>
  );
}
