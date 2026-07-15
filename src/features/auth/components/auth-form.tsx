"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const configured = isSupabaseConfigured();

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (!configured) {
        setMessage(
          "Supabase is not configured yet. Explore the demo garage while auth credentials are added.",
        );
        return;
      }

      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username,
              display_name: username,
            },
          },
        });
        if (error) throw error;
        setMessage("Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setMessage("Signed in. Redirecting to your garage…");
        window.location.href = `/garage/${username || "tunedgarage"}`;
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Authentication failed.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto w-full max-w-md space-y-5">
      {mode === "signup" ? (
        <Field
          label="Username"
          value={username}
          onChange={setUsername}
          autoComplete="username"
          required
        />
      ) : null}
      <Field
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        autoComplete="email"
        required
      />
      <Field
        label="Password"
        type="password"
        value={password}
        onChange={setPassword}
        autoComplete={mode === "login" ? "current-password" : "new-password"}
        required
      />

      <Button type="submit" className="w-full" disabled={loading}>
        {loading
          ? "Please wait…"
          : mode === "login"
            ? "Sign in"
            : "Create account"}
      </Button>

      {message ? <p className="text-sm text-foreground-muted">{message}</p> : null}

      <p className="text-sm text-foreground-subtle">
        {mode === "login" ? (
          <>
            New here?{" "}
            <Link href="/auth/signup" className="text-foreground hover:underline">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already building?{" "}
            <Link href="/auth/login" className="text-foreground hover:underline">
              Sign in
            </Link>
          </>
        )}
      </p>

      <p className="text-sm text-foreground-muted">
        Or{" "}
        <Link href="/garage/tunedgarage" className="text-accent hover:underline">
          enter the demo garage
        </Link>
        .
      </p>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] uppercase tracking-[0.16em] text-foreground-subtle">
        {label}
      </span>
      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-border bg-background-soft px-4 text-sm outline-none focus:border-border-strong"
      />
    </label>
  );
}
