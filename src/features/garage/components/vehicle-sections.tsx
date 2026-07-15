import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import type {
  DynoResult,
  MaintenanceEntry,
  Part,
  QuarterMileTime,
  Vehicle,
} from "@/types/garage";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function VehicleOverview({ vehicle }: { vehicle: Vehicle }) {
  const specs = [
    ["Year", String(vehicle.year)],
    ["Make", vehicle.make],
    ["Model", vehicle.model],
    ["Trim", vehicle.trim],
    ["Engine", vehicle.engine],
    ["Transmission", vehicle.transmission],
    ["Mileage", `${formatNumber(vehicle.mileage)} mi`],
    ["Current HP", formatNumber(vehicle.currentHorsepower)],
    ["Target HP", formatNumber(vehicle.targetHorsepower)],
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>
            Specs, notes, and the direction of this build.
          </CardDescription>
        </CardHeader>
        <dl className="grid gap-3 sm:grid-cols-2">
          {specs.map(([label, value]) => (
            <div key={label} className="rounded-xl border border-border px-4 py-3">
              <dt className="text-[10px] uppercase tracking-[0.16em] text-foreground-subtle">
                {label}
              </dt>
              <dd className="mt-1 text-sm text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
        {vehicle.notes ? (
          <p className="mt-5 text-sm leading-relaxed text-foreground-muted">
            {vehicle.notes}
          </p>
        ) : null}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Future Goals</CardTitle>
          <CardDescription>What still belongs on the lift.</CardDescription>
        </CardHeader>
        <ul className="space-y-3">
          {(vehicle.futureGoals ?? []).map((goal) => (
            <li
              key={goal}
              className="border-b border-border pb-3 text-sm text-foreground-muted last:border-0"
            >
              {goal}
            </li>
          ))}
          {!vehicle.futureGoals?.length ? (
            <li className="text-sm text-foreground-subtle">No goals listed yet.</li>
          ) : null}
        </ul>
      </Card>
    </div>
  );
}

export function PartsList({
  title,
  description,
  parts,
}: {
  title: string;
  description: string;
  parts: Part[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <div className="space-y-3">
        {parts.map((part) => (
          <div
            key={part.id}
            className="flex flex-col gap-1 border-b border-border pb-3 last:border-0 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-sm text-foreground">{part.name}</p>
              <p className="text-xs text-foreground-subtle">
                {part.brand} · {part.category}
                {part.installedAt ? ` · ${formatDate(part.installedAt)}` : ""}
              </p>
            </div>
            {part.cost != null ? (
              <p className="text-sm text-foreground-muted">
                {formatCurrency(part.cost)}
              </p>
            ) : null}
          </div>
        ))}
        {!parts.length ? (
          <p className="text-sm text-foreground-subtle">Nothing listed yet.</p>
        ) : null}
      </div>
    </Card>
  );
}

export function MaintenanceLog({ entries }: { entries: MaintenanceEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Maintenance Log</CardTitle>
        <CardDescription>Keep the bay honest and serviceable.</CardDescription>
      </CardHeader>
      <div className="space-y-4">
        {entries.map((entry) => (
          <div key={entry.id} className="border-b border-border pb-4 last:border-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-foreground">{entry.title}</p>
              <p className="text-xs uppercase tracking-[0.14em] text-foreground-subtle">
                {formatDate(entry.date)}
              </p>
            </div>
            <p className="mt-1 text-sm text-foreground-muted">{entry.notes}</p>
            <p className="mt-2 text-xs text-foreground-subtle">
              {formatNumber(entry.mileage)} mi
              {entry.cost != null ? ` · ${formatCurrency(entry.cost)}` : ""}
            </p>
          </div>
        ))}
        {!entries.length ? (
          <p className="text-sm text-foreground-subtle">No maintenance entries yet.</p>
        ) : null}
      </div>
    </Card>
  );
}

export function DynoResults({ results }: { results: DynoResult[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dyno Results</CardTitle>
        <CardDescription>Measured power, not garage myths.</CardDescription>
      </CardHeader>
      <div className="space-y-4">
        {results.map((result) => (
          <div
            key={result.id}
            className="grid gap-2 border-b border-border pb-4 last:border-0 sm:grid-cols-[1fr_auto]"
          >
            <div>
              <p className="text-sm text-foreground">
                {result.horsepower} whp · {result.torque} wtq
                {result.boostPsi != null ? ` · ${result.boostPsi} psi` : ""}
              </p>
              <p className="mt-1 text-xs text-foreground-subtle">
                {formatDate(result.date)}
                {result.notes ? ` · ${result.notes}` : ""}
              </p>
            </div>
            {result.sheetUrl ? (
              <a
                href={result.sheetUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-accent hover:underline"
              >
                View sheet
              </a>
            ) : null}
          </div>
        ))}
        {!results.length ? (
          <p className="text-sm text-foreground-subtle">No dyno sessions logged.</p>
        ) : null}
      </div>
    </Card>
  );
}

export function QuarterMileTimes({ times }: { times: QuarterMileTime[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quarter Mile Times</CardTitle>
        <CardDescription>Trap speed tells the truth.</CardDescription>
      </CardHeader>
      <div className="space-y-4">
        {times.map((time) => (
          <div key={time.id} className="border-b border-border pb-4 last:border-0">
            <p className="text-sm text-foreground">
              {time.et.toFixed(2)} ET @ {time.trapSpeed.toFixed(1)} mph
            </p>
            <p className="mt-1 text-xs text-foreground-subtle">
              {formatDate(time.date)}
              {time.reactionTime != null ? ` · RT ${time.reactionTime.toFixed(3)}` : ""}
              {time.notes ? ` · ${time.notes}` : ""}
            </p>
          </div>
        ))}
        {!times.length ? (
          <p className="text-sm text-foreground-subtle">No passes logged yet.</p>
        ) : null}
      </div>
    </Card>
  );
}
