import { redirect } from "next/navigation";

/** Gallery lives in the Garage hub at /garage?tab=gallery */
export default function GarageGalleryHubRedirectPage() {
  redirect("/garage?tab=gallery");
}
