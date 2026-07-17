import { redirect } from "next/navigation";

/** Journal section restored inside the Garage hub. */
export default function GarageJournalHubRedirectPage() {
  redirect("/garage?tab=journal");
}
