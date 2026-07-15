import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function OwnerVehicleRedirect({
  params,
}: {
  params: Promise<{ vehicleId: string }>;
}) {
  const { vehicleId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/garage/sign-in");

  const [{ data: profile }, { data: vehicle }] = await Promise.all([
    supabase.from("profiles").select("username").eq("id", user.id).maybeSingle(),
    supabase
      .from("vehicles")
      .select("id, user_id")
      .eq("id", vehicleId)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (!profile?.username || !vehicle) redirect("/garage");
  redirect(`/garage/${profile.username}/vehicles/${vehicleId}`);
}
