import { AuthShell } from "@/components/ui/AuthShell";
import { OnboardingForm } from "@/features/profile/components/OnboardingForm";

export default function OnboardingPage() {
  return (
    <AuthShell
      title="Set up your Garage Profile"
      subtitle="Choose a username the community will know you by."
    >
      <OnboardingForm />
    </AuthShell>
  );
}
