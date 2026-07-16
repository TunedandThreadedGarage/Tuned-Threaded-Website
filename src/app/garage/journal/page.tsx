import { redirect } from "next/navigation";

/** Journal is a top-level hub at /journal. */
export default function GarageJournalRedirectPage() {
  redirect("/journal");
}
