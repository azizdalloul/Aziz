export function PageHead({ title, lead }: { title: string; lead?: string }) {
  return (
    <section className="bg-navy-900 text-ivory">
      <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <h1>{title}</h1>
        {lead && <p className="mt-4 max-w-2xl text-lg text-ivory/80">{lead}</p>}
      </div>
    </section>
  );
}
export const Wrap = ({ children, className = "" }: { children: React.ReactNode; className?: string }) =>
  <div className={`mx-auto max-w-6xl px-4 py-10 ${className}`}>{children}</div>;
