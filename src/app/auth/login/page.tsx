import type { Metadata } from "next";
import { AuthForm } from "@/features/auth/components/auth-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-5 py-16 md:px-8">
      <div className="mx-auto w-full max-w-md">
        <p className="text-[11px] uppercase tracking-[0.22em] text-foreground-subtle">
          Tuned &amp; Threaded
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-instrument)] text-4xl tracking-tight">
          Sign in
        </h1>
        <p className="mt-3 text-sm text-foreground-muted">
          Return to your garage profile, builds, and journal.
        </p>
        <div className="mt-10">
          <AuthForm mode="login" />
        </div>
      </div>
    </main>
  );
}
