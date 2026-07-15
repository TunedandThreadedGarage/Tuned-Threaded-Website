import type {
  BuildPerformance,
  VehicleDynoResult,
  VehicleQuarterMileTime,
} from "@/types/database";

function LineChart({
  label,
  points,
  color = "var(--color-accent)",
}: {
  label: string;
  points: { x: string; y: number }[];
  color?: string;
}) {
  if (points.length === 0) {
    return (
      <div className="border border-border bg-bg/40 p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-metal">
          {label}
        </p>
        <p className="mt-3 text-sm text-text-muted">No data yet.</p>
      </div>
    );
  }
  const ys = points.map((p) => p.y);
  const min = Math.min(...ys);
  const max = Math.max(...ys);
  const span = Math.max(max - min, 1);
  const w = 320;
  const h = 120;
  const pad = 8;
  const coords = points
    .map((p, i) => {
      const x = pad + (i / Math.max(points.length - 1, 1)) * (w - pad * 2);
      const y = h - pad - ((p.y - min) / span) * (h - pad * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="border border-border bg-bg/40 p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-metal">
        {label}
      </p>
      <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 w-full" aria-hidden>
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          points={coords}
        />
      </svg>
      <div className="mt-2 flex justify-between font-mono text-[10px] text-metal">
        <span>{points[0]?.y}</span>
        <span>{points[points.length - 1]?.y}</span>
      </div>
    </div>
  );
}

export function PerfCharts({
  dyno,
  quarterMile,
  performance,
}: {
  dyno: VehicleDynoResult[];
  quarterMile: VehicleQuarterMileTime[];
  performance: BuildPerformance[];
}) {
  const hp = dyno
    .filter((d) => d.whp != null)
    .map((d) => ({ x: d.result_date, y: d.whp as number }));
  const tq = dyno
    .filter((d) => d.wtq != null)
    .map((d) => ({ x: d.result_date, y: d.wtq as number }));

  const zeroSixty = performance.filter((p) => p.perf_type === "zero_sixty");
  const topSpeed = performance.filter((p) => p.perf_type === "top_speed");
  const track = performance.filter((p) => p.perf_type === "track");

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <LineChart label="Horsepower (WHP)" points={hp} />
        <LineChart label="Torque (WTQ)" points={tq} color="var(--color-metal)" />
      </div>

      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-metal">
          Quarter mile
        </p>
        {quarterMile.length === 0 ? (
          <p className="mt-2 text-sm text-text-muted">No passes logged.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border border border-border">
            {quarterMile.map((q) => (
              <li
                key={q.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <span className="text-text">{q.result_date}</span>
                <span className="font-mono text-metal">
                  {q.et_seconds != null ? `${q.et_seconds}s` : "—"} ·{" "}
                  {q.trap_mph != null ? `${q.trap_mph} mph` : "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "0–60", rows: zeroSixty },
          { label: "Top speed", rows: topSpeed },
          { label: "Track", rows: track },
        ].map((block) => (
          <div key={block.label} className="border border-border bg-bg/40 p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-metal">
              {block.label}
            </p>
            {block.rows.length === 0 ? (
              <p className="mt-2 text-sm text-text-muted">—</p>
            ) : (
              <ul className="mt-2 space-y-2 text-sm text-text">
                {block.rows.map((r) => (
                  <li key={r.id}>
                    {r.value_numeric} {r.unit}
                    <span className="ml-2 font-mono text-[10px] text-metal">
                      {r.result_date}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
