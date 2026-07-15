import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GarageProfileHeader } from "@/features/garage/components/garage-profile-header";
import {
  GarageStatsSection,
  GarageStatsStrip,
} from "@/features/garage/components/garage-stats";
import { PhotoGallery } from "@/features/garage/components/photo-gallery";
import { VehicleGrid } from "@/features/garage/components/vehicle-card";
import { getGarageByUsername } from "@/lib/garage/queries";

type PageProps = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { username } = await params;
  const garage = await getGarageByUsername(username);
  if (!garage) return { title: "Garage not found" };
  return {
    title: `${garage.profile.displayName} (@${garage.profile.username})`,
    description: garage.profile.bio,
  };
}

export default async function GarageProfilePage({ params }: PageProps) {
  const { username } = await params;
  const garage = await getGarageByUsername(username);
  if (!garage) notFound();

  const { profile, vehicles, gallery } = garage;

  return (
    <main className="flex-1 pb-20">
      <GarageProfileHeader profile={profile} isOwner />
      <GarageStatsStrip profile={profile} />
      <VehicleGrid
        vehicles={vehicles}
        username={profile.username}
        accentColor={profile.accentColor}
      />
      <PhotoGallery photos={gallery} canUpload />
      <GarageStatsSection profile={profile} />
    </main>
  );
}
