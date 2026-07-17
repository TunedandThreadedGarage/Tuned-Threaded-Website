import Link from "next/link";
import { AuthShell } from "@/components/ui/AuthShell";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";
import { isEmailAuthEnabled } from "@/features/auth/providers";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset password"
      subtitle="We’ll email a branded Tuned & Threaded reset link."
      footer={
        <>
          Remembered it?{" "}
          <Link href="/garage/sign-in" className="text-text underline">
            Sign in
          </Link>
        </>
      }
    >
      {isEmailAuthEnabled() ? (
        <ForgotPasswordForm />
      ) : (
        <p className="text-sm text-text-muted">
          Email sign-in is disabled for this environment.
        </p>
      )}
    </AuthShell>
  );
}
