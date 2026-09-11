/**
 * Apply infra/migrations/001_assessment_playbooks.sql against DATABASE_URL / POSTGRES_*.
 *
 * Usage (from monorepo root):
 *   pnpm --filter @annex21/api migrate
 *
 * Boot path: PgService also runs this migration automatically when Postgres is reachable.
 */
import { Pool } from 'pg';
import { resolveDatabaseUrl } from '../src/db/resolve-database-url';
import { runAssessmentMigrations } from '../src/db/migrate';

async function main() {
  const url = resolveDatabaseUrl();
  if (!url) {
    console.error(
      'No DATABASE_URL or POSTGRES_* — configure .env (see .env.example) or start docker-compose.',
    );
    process.exit(1);
  }
  const pool = new Pool({ connectionString: url });
  try {
    const path = await runAssessmentMigrations(pool);
    console.log(`OK — migration applied from ${path}`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
