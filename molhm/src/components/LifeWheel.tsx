import { SCORE_FIELDS, wheelPoints } from "@/lib/scales";

/** عجلة الحياة: 7 محاور، نطاق 1–10. عرض وصفي فقط. */
export function LifeWheel({ values, size = 300, compare }: { values: number[]; size?: number; compare?: number[] }) {
  const c = size / 2, r = size / 2 - 46;
  const pts = wheelPoints(values, c, c, r);
  const poly = (p: { x: number; y: number }[]) => p.map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(" ");
  const cmp = compare ? wheelPoints(compare, c, c, r) : null;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto w-full max-w-[340px]" role="img"
      aria-label={"عجلة الحياة: " + SCORE_FIELDS.map((f, i) => `${f.label} ${values[i]}`).join("، ")}>
      {[2, 4, 6, 8, 10].map((k) => <polygon key={k} points={poly(wheelPoints(Array(7).fill(k), c, c, r))} fill="none" stroke="#0B1B3A" strokeOpacity=".12" />)}
      {pts.map((p, i) => <line key={i} x1={c} y1={c} x2={p.ax} y2={p.ay} stroke="#0B1B3A" strokeOpacity=".15" />)}
      {cmp && <polygon points={poly(cmp)} fill="#0B1B3A" fillOpacity=".08" stroke="#0B1B3A" strokeDasharray="4 3" />}
      <polygon points={poly(pts)} fill="#B8975A" fillOpacity=".35" stroke="#8F7240" strokeWidth="2" />
      {pts.map((p, i) => {
        const lx = c + (p.ax - c) * 1.2, ly = c + (p.ay - c) * 1.2;
        return <text key={i} x={lx} y={ly} fontSize="10" textAnchor="middle" fill="#13294F">{SCORE_FIELDS[i].label.split(" ")[0] === "الجانب" ? SCORE_FIELDS[i].label.replace("الجانب ", "") : SCORE_FIELDS[i].label.split(" ").slice(0, 2).join(" ")}</text>;
      })}
    </svg>
  );
}
