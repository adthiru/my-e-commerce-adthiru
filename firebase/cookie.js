// Mirrors the Firebase ID token into a non-HttpOnly cookie so that
// cookie-replaying clients (e.g. the QualityAssuranceAIAgent) can pick
// up auth state without needing IndexedDB.
//
// The cookie contains a JWT whose payload includes the user's uid.
// ID tokens expire in 1 hour; for normal users, onIdTokenChanged refreshes it.

export const TOKEN_COOKIE = "fb_token";

export function setTokenCookie(token) {
  if (typeof document === "undefined" || !token) return;
  document.cookie = `${TOKEN_COOKIE}=${token}; path=/; max-age=3600; SameSite=Lax`;
}

export function clearTokenCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export function readTokenCookie() {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${TOKEN_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// Decode the JWT payload without verifying the signature. Safe for UI-only use.
export function decodeTokenPayload(token) {
  try {
    const [, payload] = token.split(".");
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}
