import { redirect } from "next/navigation";

type SearchParams = Promise<{ edit?: string }>;

/** Vehicles live in the Garage hub at /garage?tab=vehicles */
export default async function GarageVehiclesRedirectPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const sp = new URLSearchParams({ tab: "vehicles" });
  if (params.edit) sp.set("edit", params.edit);
  redirect(`/garage?${sp.toString()}`);
}
