import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GARAGE_RESERVED } from "@/lib/garage-routes";
import { ProgressBar } from "@/components/garage-profile/ProgressBar";
import { SectionCard } from "@/components/garage-profile/SectionCard";
import { TimelineFeed } from "@/components/garage-profile/TimelineFeed";
import { VehicleOwnerForms } from "@/features/vehicles/components/VehicleOwnerForms";
import { formatMoneyFromCents } from "@/lib/garage-stats";
import type {
  Modification,
  TimelineEntryComment,
  Vehicle,
  VehicleDynoResult,
  VehicleMaintenanceLog,
  VehiclePhoto,
  VehicleQuarterMileTime,
  VehicleTimelineEntry,
} from "@/types/database";

export default async function VehiclePage({
  params,
}: {
  params: Promise<{ username: string; vehicleId: string }>;
}) {
  const { username, vehicleId } = await params;
  if (GARAGE_RESERVED.has(username)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, accent_color")
    .eq("username", username.toLowerCase())
    .maybeSingle();
  if (!profile) notFound();

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", vehicleId)
    .eq("user_id", profile.id)
    .maybeSingle();
  if (!vehicle) notFound();

  const isOwner = user?.id === profile.id;
  const v = vehicle as Vehicle;

  const [
    { data: photos },
    { data: timeline },
    { data: mods },
    { data: maintenance },
    { data: dyno },
    { data: ets },
  ] = await Promise.all([
    supabase
      .from("vehicle_photos")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .order("sort_order"),
    supabase
      .from("vehicle_timeline_entries")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .order("entry_date", { ascending: false }),
    supabase
      .from("modifications")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .order("created_at", { ascending: false }),
    supabase
      .from("vehicle_maintenance_logs")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .order("service_date", { ascending: false }),
    supabase
      .from("vehicle_dyno_results")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .order("result_date", { ascending: false }),
    supabase
      .from("vehicle_quarter_mile_times")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .order("result_date", { ascending: false }),
  ]);

  const entries = (timeline ?? []) as VehicleTimelineEntry[];
  const entryIds = entries.map((e) => e.id);

  const [{ data: likes }, { data: comments }] =
    entryIds.length > 0
      ? await Promise.all([
          user
            ? supabase
                .from("timeline_entry_likes")
                .select("entry_id")
                .eq("user_id", user.id)
                .in("entry_id", entryIds)
            : Promise.resolve({ data: [] as { entry_id: string }[] }),
          supabase
            .from("timeline_entry_comments")
            .select("*")
            .in("entry_id", entryIds)
            .order("created_at", { ascending: true }),
        ])
      : [{ data: [] }, { data: [] }];

  const likedEntryIds = new Set((likes ?? []).map((l) => l.entry_id));
  const commentsByEntry = new Map<string, TimelineEntryComment[]>();
  for (const c of (comments ?? []) as TimelineEntryComment[]) {
    const list = commentsByEntry.get(c.entry_id) ?? [];
    list.push(c);
    commentsByEntry.set(c.entry_id, list);
  }

  const installed = ((mods ?? []) as Modification[]).filter(
    (m) => m.status === "installed",
  );
  const future = ((mods ?? []) as Modification[]).filter(
    (m) => m.status === "wishlist",
  );
  const title =
    v.nickname || [v.year, v.make, v.model].filter(Boolean).join(" ");

  return (
    <div
      className="space-y-10"
      style={
        {
          ["--garage-accent" as string]: profile.accent_color || "#c4121a",
        } as React.CSSProperties
      }
    >
      <div>
        <Link
          href={`/garage/${username}`}
          className="text-sm text-text-muted hover:text-text"
        >
          ← @{username}
        </Link>
        <div className="mt-4 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="relative aspect-[16/10] overflow-hidden border border-border bg-surface-elevated">
            {v.photo_url ? (
              <Image
                src={v.photo_url}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 60vw"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-text-muted">
                No cover photo
              </div>
            )}
          </div>
          <div className="space-y-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-metal">
              Vehicle
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-text">
              {title}
            </h1>
            {v.trim ? <p className="text-text-muted">{v.trim}</p> : null}
            <ProgressBar value={v.progress_pct} label="Current progress" />
            {v.build_stage ? (
              <p className="text-sm text-text-muted">
                Stage: <span className="text-text">{v.build_stage}</span>
              </p>
            ) : null}
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {[
                ["Engine", v.engine],
                ["Transmission", v.transmission],
                [
                  "Mileage",
                  v.mileage != null ? `${v.mileage.toLocaleString()} mi` : null,
                ],
                [
                  "Horsepower",
                  v.current_hp != null
                    ? `${v.current_hp}${v.target_hp != null ? ` → ${v.target_hp}` : ""}`
                    : null,
                ],
              ].map(([label, value]) =>
                value ? (
                  <div key={label as string}>
                    <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-metal">
                      {label}
                    </dt>
                    <dd className="mt-1 text-text">{value}</dd>
                  </div>
                ) : null,
              )}
            </dl>
          </div>
        </div>
      </div>

      <SectionCard title="Overview" description="Specs, progress, and goals.">
        <div className="space-y-3 text-sm text-text-muted">
          {v.notes ? <p className="leading-relaxed text-text">{v.notes}</p> : (
            <p>No notes yet.</p>
          )}
          <p>
            Future goal:{" "}
            {v.target_hp != null
              ? `${v.target_hp} hp`
              : "Set a horsepower target in vehicle settings."}
          </p>
        </div>
      </SectionCard>

      <SectionCard title="Photos">
        {(photos ?? []).length > 0 ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {((photos ?? []) as VehiclePhoto[]).map((p) => (
              <div
                key={p.id}
                className="relative aspect-square overflow-hidden border border-border"
              >
                <Image src={p.url} alt={p.caption ?? ""} fill className="object-cover" sizes="200px" />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted">
            No vehicle gallery photos yet.
            {v.photo_url ? " Cover photo is shown above." : ""}
          </p>
        )}
      </SectionCard>

      <SectionCard
        title="Build Timeline"
        description="Automotive build history — updates, parts, cost, and time."
      >
        <TimelineFeed
          entries={entries}
          commentsByEntry={commentsByEntry}
          likedEntryIds={likedEntryIds}
          canInteract={Boolean(user)}
          isOwner={isOwner}
        />
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Installed Parts">
          {installed.length > 0 ? (
            <ul className="space-y-3">
              {installed.map((m) => (
                <li key={m.id} className="border-b border-border pb-3 text-sm last:border-0">
                  <p className="text-text">{m.title}</p>
                  <p className="text-text-muted">
                    {[m.part_brand, m.part_number].filter(Boolean).join(" · ")}
                    {m.cost_cents != null
                      ? ` · ${formatMoneyFromCents(m.cost_cents)}`
                      : ""}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-muted">No installed parts listed.</p>
          )}
        </SectionCard>
        <SectionCard title="Future Parts">
          {future.length > 0 ? (
            <ul className="space-y-3">
              {future.map((m) => (
                <li key={m.id} className="border-b border-border pb-3 text-sm last:border-0">
                  <p className="text-text">{m.title}</p>
                  {m.description ? (
                    <p className="text-text-muted">{m.description}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-muted">No future parts listed.</p>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Maintenance Log">
        {((maintenance ?? []) as VehicleMaintenanceLog[]).length > 0 ? (
          <ul className="space-y-3">
            {((maintenance ?? []) as VehicleMaintenanceLog[]).map((m) => (
              <li key={m.id} className="text-sm">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-metal">
                  {m.service_date}
                </p>
                <p className="text-text">{m.title}</p>
                {m.notes ? <p className="text-text-muted">{m.notes}</p> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-text-muted">No maintenance entries.</p>
        )}
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Dyno Results">
          {((dyno ?? []) as VehicleDynoResult[]).length > 0 ? (
            <ul className="space-y-3">
              {((dyno ?? []) as VehicleDynoResult[]).map((d) => (
                <li key={d.id} className="text-sm text-text">
                  {d.result_date}: {d.whp ?? "—"} whp / {d.wtq ?? "—"} wtq
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-muted">No dyno sheets yet.</p>
          )}
        </SectionCard>
        <SectionCard title="Quarter Mile Times">
          {((ets ?? []) as VehicleQuarterMileTime[]).length > 0 ? (
            <ul className="space-y-3">
              {((ets ?? []) as VehicleQuarterMileTime[]).map((t) => (
                <li key={t.id} className="text-sm text-text">
                  {t.result_date}: {t.et_seconds ?? "—"}s @ {t.trap_mph ?? "—"}{" "}
                  mph
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-muted">No times recorded.</p>
          )}
        </SectionCard>
      </div>

      {isOwner ? (
        <SectionCard
          title="Manage this vehicle"
          description="Update specs, add timeline posts, maintenance, dyno, and ET."
        >
          <VehicleOwnerForms vehicle={v} />
        </SectionCard>
      ) : null}
    </div>
  );
}
