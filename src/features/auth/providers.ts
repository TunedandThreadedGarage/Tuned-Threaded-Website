import type { Provider } from "@supabase/supabase-js";

export type AuthProviderId = "email" | "google" | "apple" | "discord";

export type AuthProviderConfig = {
  id: AuthProviderId;
  label: string;
  /** Maps to Supabase OAuth provider id when not email */
  oauthProvider?: Provider;
  enabled: boolean;
};

/**
 * Modular auth registry. Enable/disable providers here and in the Supabase dashboard.
 * Adding a provider later: append a row and turn it on in Authentication → Providers.
 */
export const AUTH_PROVIDERS: AuthProviderConfig[] = [
  {
    id: "email",
    label: "Email",
    enabled: true,
  },
  {
    id: "google",
    label: "Google",
    oauthProvider: "google",
    enabled: true,
  },
  {
    id: "apple",
    label: "Apple",
    oauthProvider: "apple",
    enabled: true,
  },
  {
    id: "discord",
    label: "Discord",
    oauthProvider: "discord",
    enabled: true,
  },
];

export function getOAuthProviders() {
  return AUTH_PROVIDERS.filter((p) => p.enabled && p.oauthProvider);
}

export function isEmailAuthEnabled() {
  return AUTH_PROVIDERS.some((p) => p.id === "email" && p.enabled);
}
