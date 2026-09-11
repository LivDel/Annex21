/**
 * Open-redirect hardening for GET /auth/verify?redirect=
 * Never trust arbitrary client redirect / redirectUri.
 * Allow only:
 *  - relative paths starting with `/` (same web origin), OR
 *  - absolute URLs whose origin is in AUTH_REDIRECT_ALLOWLIST
 * Reject: https://evil.com, //evil.com, javascript:, data:, etc.
 */

const DEFAULT_PATH = '/app';

function webOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_WEB_ORIGIN ??
    process.env.API_CORS_ORIGIN ??
    'http://localhost:3000'
  );
}

/** Comma-separated origins; always includes localhost:3000 + web CORS origin. */
export function redirectAllowlist(): Set<string> {
  const defaults = [
    'http://localhost:3000',
    webOrigin(),
    process.env.API_CORS_ORIGIN,
    process.env.NEXT_PUBLIC_WEB_ORIGIN,
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
 * Returns a safe absolute redirect URL on the web origin (or allowlisted).
 * Invalid / missing → `${webOrigin}/app`.
 */
export function sanitizeAuthRedirect(raw: string | undefined | null): string {
  const origin = webOrigin();
  const fallback = `${origin.replace(/\/$/, '')}${DEFAULT_PATH}`;

  if (raw == null || String(raw).trim() === '') {
    return fallback;
  }

  const trimmed = String(raw).trim();

  // Protocol-relative //evil.com
  if (trimmed.startsWith('//')) {
    return fallback;
  }

  // Relative path: must start with single `/`, no backslash / control chars
  if (trimmed.startsWith('/')) {
    if (
      trimmed.startsWith('//') ||
      trimmed.includes('\\') ||
      /[\u0000-\u001f]/.test(trimmed)
    ) {
      return fallback;
    }
    try {
      const resolved = new URL(trimmed, origin);
      if (resolved.origin !== new URL(origin).origin) {
        return fallback;
      }
      return resolved.toString();
    } catch {
      return fallback;
    }
  }

  // Absolute URL — only http(s) + allowlisted origin
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return fallback;
    }
    // Block credentials in URL, userinfo tricks
    if (url.username || url.password) {
      return fallback;
    }
    if (!redirectAllowlist().has(url.origin)) {
      return fallback;
    }
    return url.toString();
  } catch {
    return fallback;
  }
}
