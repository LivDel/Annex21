import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Pool } from 'pg';

function resolveMigrationsDir(): string {
  const candidates = [
    join(process.cwd(), 'infra/migrations'),
    join(process.cwd(), '../../infra/migrations'),
    join(__dirname, '../../../../infra/migrations'),
    join(__dirname, '../../../../../infra/migrations'),
  ];
  for (const path of candidates) {
    try {
      readdirSync(path);
      return path;
    } catch {
      /* try next */
    }
  }
  throw new Error(
    'Dossier infra/migrations introuvable. ' +
      'Lancer depuis monorepo root ou: pnpm --filter @annex21/api migrate',
  );
}

/**
 * Apply infra/migrations/*.sql in lexical order (idempotent CREATE IF NOT EXISTS).
 * Includes 001_assessment_playbooks + 002_trust_editor.
 */
export async function runAssessmentMigrations(pool: Pool): Promise<string> {
  const dir = resolveMigrationsDir();
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  if (files.length === 0) {
    throw new Error(`Aucune migration SQL dans ${dir}`);
  }
  for (const file of files) {
    const sql = readFileSync(join(dir, file), 'utf8');
    await pool.query(sql);
  }
  return `${dir} (${files.join(', ')})`;
}
