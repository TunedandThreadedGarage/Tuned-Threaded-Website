import Link from "next/link";
import { AuthShell } from "@/components/ui/AuthShell";
import { SignInForm } from "@/features/auth/components/SignInForm";
import { OAuthButtons } from "@/features/auth/components/OAuthButtons";
import { isEmailAuthEnabled } from "@/features/auth/providers";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = params.next ?? "/garage";

  return (
    <AuthShell
      title="Sign in"
      subtitle="Enter your Garage Profile."
      footer={
        <>
          New here?{" "}
          <Link href="/garage/sign-up" className="text-text underline">
            Create a Garage Profile
          </Link>
        </>
      }
    >
      {isEmailAuthEnabled() ? <SignInForm next={next} /> : null}
      <OAuthButtons />
    </AuthShell>
  );
}
