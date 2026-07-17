"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOAuthProviders } from "@/features/auth/providers";
import type { Provider } from "@supabase/supabase-js";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export type AuthResult = {
  error?: string;
  success?: boolean;
  /** Shown when account created but email confirmation is required (no session yet). */
  message?: string;
};

export async function signUpWithEmail(
  _prev: AuthResult,
  formData: FormData,
): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl()}/auth/callback?next=/garage/onboarding`,
    },
  });

  if (error) return { error: error.message };

  // Branded welcome — fires as soon as the account exists.
  try {
    const { sendWelcomeEmail } = await import("@/lib/email/dispatch");
    await sendWelcomeEmail(email);
  } catch {
    // Welcome email is best-effort; never block signup.
  }

  // Branded verification when Supabase requires email confirmation.
  if (!data.session) {
    try {
      const admin = createAdminClient();
      if (admin) {
        const { data: linkData } = await admin.auth.admin.generateLink({
          type: "signup",
          email,
          password,
          options: {
            redirectTo: `${siteUrl()}/auth/callback?next=/garage/onboarding`,
          },
        });
        const verifyUrl = linkData?.properties?.action_link;
        if (verifyUrl) {
          const { sendVerifyEmail } = await import("@/lib/email/dispatch");
          await sendVerifyEmail(email, verifyUrl);
        }
      }
    } catch {
      // Verification email is best-effort; Supabase may also send its own.
    }
  }

  // Instant session when "Confirm email" is disabled in Supabase.
  if (data.session) {
    redirect("/garage/onboarding");
  }

  // Account created; waiting on email confirmation.
  return {
    success: true,
    message:
      "Check your email to confirm your account, then sign in to finish your Garage Profile.",
  };
}

export async function signInWithEmail(
  _prev: AuthResult,
  formData: FormData,
): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/garage");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  redirect(next.startsWith("/") ? next : "/garage");
}

export async function requestPasswordReset(
  _prev: AuthResult,
  formData: FormData,
): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Email is required." };

  const redirectTo = `${siteUrl()}/auth/callback?next=/garage/settings/password`;

  try {
    const admin = createAdminClient();
    if (admin) {
      const { data: linkData, error } = await admin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: { redirectTo },
      });
      if (error) return { error: error.message };
      const resetUrl = linkData?.properties?.action_link;
      if (resetUrl) {
        const { sendPasswordResetEmail } = await import("@/lib/email/dispatch");
        await sendPasswordResetEmail(email, resetUrl);
      }
    } else {
      // Fallback when service role is unavailable — uses Supabase mailer.
      const supabase = await createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      if (error) return { error: error.message };
    }
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Unable to send reset email.",
    };
  }

  return {
    success: true,
    message: "If an account exists for that email, a reset link is on the way.",
  };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function signInWithOAuth(provider: Provider): Promise<AuthResult> {
  const allowed = getOAuthProviders().some((p) => p.oauthProvider === provider);
  if (!allowed) {
    return { error: "This sign-in method is not enabled." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${siteUrl()}/auth/callback?next=/garage/onboarding`,
    },
  });

  if (error) return { error: error.message };
  if (data.url) redirect(data.url);
  return { error: "Unable to start OAuth sign-in." };
}
