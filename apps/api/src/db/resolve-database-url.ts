/**
 * Resolve Postgres connection when DATABASE_URL or POSTGRES_* are set.
 * Returns null if neither is configured → caller uses in-memory fallback.
 */
export function resolveDatabaseUrl(): string | null {
  const direct = process.env.DATABASE_URL?.trim();
  if (direct) return direct;

  const host = process.env.POSTGRES_HOST?.trim();
  if (!host) return null;

  const port = process.env.POSTGRES_PORT?.trim() || '5432';
  const db = process.env.POSTGRES_DB?.trim() || 'annex21';
  const user = process.env.POSTGRES_USER?.trim() || 'annex21';
  const password = process.env.POSTGRES_PASSWORD ?? '';

  const enc = encodeURIComponent;
  return `postgresql://${enc(user)}:${enc(password)}@${host}:${port}/${db}`;
}

export function isDatabaseConfigured(): boolean {
  return resolveDatabaseUrl() !== null;
}
