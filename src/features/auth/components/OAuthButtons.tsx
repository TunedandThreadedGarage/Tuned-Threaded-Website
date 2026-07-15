"use client";

import { useTransition } from "react";
import type { Provider } from "@supabase/supabase-js";
import { signInWithOAuth } from "@/features/auth/actions";
import { getOAuthProviders } from "@/features/auth/providers";

export function OAuthButtons() {
  const [pending, startTransition] = useTransition();
  const providers = getOAuthProviders();

  if (providers.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="relative py-2 text-center text-xs uppercase tracking-[0.18em] text-text-muted">
        <span className="relative z-10 bg-surface px-3">Or continue with</span>
        <span className="absolute inset-x-0 top-1/2 h-px bg-border" aria-hidden />
      </div>
      <div className="grid gap-2">
        {providers.map((provider) => (
          <button
            key={provider.id}
            type="button"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                await signInWithOAuth(provider.oauthProvider as Provider);
              });
            }}
            className="flex h-11 items-center justify-center border border-border bg-bg text-sm font-medium text-text transition-colors hover:border-metal/40 hover:bg-surface-elevated disabled:opacity-60"
          >
            {provider.label}
          </button>
        ))}
      </div>
    </div>
  );
}
