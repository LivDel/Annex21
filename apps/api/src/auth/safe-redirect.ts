/**
 * Open-redirect hardening for GET /auth/verify?redirect= and
 * POST /connectors/:provider/connect (redirectUri / redirect).
 * Never trust arbitrary client redirect / redirectUri.
 * Allow only:
 *  - relative paths starting with `/` (same web origin), OR
 *  - absolute URLs whose origin is in AUTH_REDIRECT_ALLOWLIST
 *    (web origin + API public origin for OAuth callbacks)
 * Reject: https://evil.com, //evil.com, javascript:, data:, etc.
 *
 * Soft follow-up after PR #5: default post-verify land is Étape 1/2
 * (`/app/onboarding`), not connectors (`/app`).
 */

/** Post-verify / missing-redirect default — onboarding Étape 1/2. */
const DEFAULT_PATH = '/app/onboarding';

function webOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_WEB_ORIGIN ??
    process.env.API_CORS_ORIGIN ??
    'http://localhost:3000'
  );
}

function apiOrigin(): string {
  return (
    process.env.API_PUBLIC_URL ??
    `http://localhost:${process.env.API_PORT ?? 3001}`
  );
}

/** Comma-separated origins; always includes localhost:3000 + web CORS + API public. */
export function redirectAllowlist(): Set<string> {
  const defaults = [
    'http://localhost:3000',
    'http://localhost:3001',
    webOrigin(),
    apiOrigin(),
    process.env.API_CORS_ORIGIN,
    process.env.NEXT_PUBLIC_WEB_ORIGIN,
    process.env.API_PUBLIC_URL,
  ].filter(Boolean) as string[];

  const fromEnv = (process.env.AUTH_REDIRECT_ALLOWLIST ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const set = new Set<string>();
  for (const raw of [...defaults, ...fromEnv]) {
    try {
      set.add(new URL(raw).origin);
    } catch {
      /* ignore malformed entries */
    }
  }
  return set;
}

/**
 * Core allowlist check — returns a safe absolute URL, or `null` if rejected.
 * Shared by auth verify and connectors connect (no silent evil.com passthrough).
 */
export function trySanitizeRedirect(raw: string | undefined | null): string | null {
  if (raw == null || String(raw).trim() === '') {
    return null;
  }

  const origin = webOrigin();
  const trimmed = String(raw).trim();

  // Protocol-relative //evil.com
  if (trimmed.startsWith('//')) {
    return null;
  }

  // Relative path: must start with single `/`, no backslash / control chars
  if (trimmed.startsWith('/')) {
    if (
      trimmed.startsWith('//') ||
      trimmed.includes('\\') ||
      /[\u0000-\u001f]/.test(trimmed)
    ) {
      return null;
    }
    try {
      const resolved = new URL(trimmed, origin);
      if (resolved.origin !== new URL(origin).origin) {
        return null;
      }
      return resolved.toString();
    } catch {
      return null;
    }
  }

  // Absolute URL — only http(s) + allowlisted origin
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }
    // Block credentials in URL, userinfo tricks
    if (url.username || url.password) {
      return null;
    }
    if (!redirectAllowlist().has(url.origin)) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Returns a safe absolute redirect URL on the web origin (or allowlisted).
 * Invalid / missing → `${webOrigin}/app/onboarding` (Étape 1/2).
 */
export function sanitizeAuthRedirect(
  raw: string | undefined | null,
  defaultPath: string = DEFAULT_PATH,
): string {
  const origin = webOrigin();
  const fallback = `${origin.replace(/\/$/, '')}${defaultPath.startsWith('/') ? defaultPath : `/${defaultPath}`}`;
  return trySanitizeRedirect(raw) ?? fallback;
}
