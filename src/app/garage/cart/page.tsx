import { redirect } from "next/navigation";

/** Cart lives in the header drawer — keep this path for old links. */
export default function CartRedirectPage() {
  redirect("/store?cart=open");
}
