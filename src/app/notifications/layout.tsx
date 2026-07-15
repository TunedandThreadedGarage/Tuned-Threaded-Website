import { SiteHeader } from "@/components/layout/SiteHeader";
import { GarageExperience } from "@/components/garage/GarageExperience";

export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GarageExperience>
      <SiteHeader />
      <main className="mx-auto w-full max-w-[820px] px-5 pb-24 pt-24 md:px-8">
        {children}
      </main>
    </GarageExperience>
  );
}
