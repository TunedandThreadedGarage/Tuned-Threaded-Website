import { redirect } from "next/navigation";

/** Builds list lives in the Garage hub. Detail/new routes stay separate. */
export default function GarageBuildsHubRedirectPage() {
  redirect("/garage?tab=builds");
}
