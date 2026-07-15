export const GARAGE_SESSION_KEY = "tt-garage-entered";
export const GARAGE_VISITED_KEY = "tt-garage-visited";

/** Understated, mechanical door — long enough to feel real, short enough to stay calm. */
export const GARAGE_DOOR_DURATION_S = 1.6;
export const GARAGE_WELCOME_DURATION_MS = 3000;
export const GARAGE_LOGO_HANDOFF_DELAY_MS = 900;

export function hasEnteredGarageThisSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(GARAGE_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function markGarageEnteredThisSession(): void {
  try {
    sessionStorage.setItem(GARAGE_SESSION_KEY, "1");
  } catch {
    // Ignore private-mode / storage failures.
  }
}

export function hasVisitedGarageBefore(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(GARAGE_VISITED_KEY) === "1";
  } catch {
    return false;
  }
}

export function markGarageVisited(): void {
  try {
    localStorage.setItem(GARAGE_VISITED_KEY, "1");
  } catch {
    // Ignore private-mode / storage failures.
  }
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
