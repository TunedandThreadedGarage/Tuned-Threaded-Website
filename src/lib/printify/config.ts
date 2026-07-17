/** Printify REST API configuration — secrets from env only. */

export function printifyApiToken() {
  return process.env.PRINTIFY_API_TOKEN?.trim() || "";
}

export function printifyShopId() {
  const raw = process.env.PRINTIFY_SHOP_ID?.trim() || "";
  if (!raw) return null;
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

export function isPrintifyConfigured() {
  return Boolean(printifyApiToken() && printifyShopId() != null);
}

/** Comma-separated emails allowed to use /admin Printify tools. */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined) {
  if (!email) return false;
  const allowed = adminEmails();
  if (allowed.length === 0) return false;
  return allowed.includes(email.trim().toLowerCase());
}

export const PRINTIFY_API_BASE = "https://api.printify.com/v1";
export const PRINTIFY_USER_AGENT = "TunedAndThreaded/1.0 (Printify Integration)";
