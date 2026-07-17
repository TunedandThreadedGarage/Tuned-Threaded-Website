"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type PasswordResult = { error?: string; success?: boolean };

export async function updateAccountPassword(
  _prev: PasswordResult,
  formData: FormData,
): Promise<PasswordResult> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirm) {
    return { error: "Passwords do not match." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  try {
    if (user.email) {
      const { sendSecurityEmail } = await import("@/lib/email/dispatch");
      await sendSecurityEmail(user.email, "passwordChanged");
    }
  } catch {
    // Security email is best-effort.
  }

  revalidatePath("/garage/settings/password");
  return { success: true };
}
