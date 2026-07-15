import Link from "next/link";
import { AuthShell } from "@/components/ui/AuthShell";
import { SignUpForm } from "@/features/auth/components/SignUpForm";
import { OAuthButtons } from "@/features/auth/components/OAuthButtons";
import { isEmailAuthEnabled } from "@/features/auth/providers";

export default function SignUpPage() {
  return (
    <AuthShell
      title="Join the Garage"
      subtitle="Create your Garage Profile — built for enthusiasts, not just checkout accounts."
      footer={
        <>
          Already a member?{" "}
          <Link href="/garage/sign-in" className="text-text underline">
            Sign in
          </Link>
        </>
      }
    >
      {isEmailAuthEnabled() ? <SignUpForm /> : null}
      <OAuthButtons />
    </AuthShell>
  );
}
