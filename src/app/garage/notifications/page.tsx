import { redirect } from "next/navigation";

/** Garage Alerts deep-link — unified center lives at /notifications. */
export default function GarageNotificationsRedirect() {
  redirect("/notifications");
}
