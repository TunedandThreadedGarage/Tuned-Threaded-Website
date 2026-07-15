"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
