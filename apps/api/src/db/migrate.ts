import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Pool } from 'pg';

/**
 * Apply infra/migrations/001_assessment_playbooks.sql (idempotent CREATE IF NOT EXISTS).
 * Looks relative to monorepo root (cwd or ../../../../ from dist).
 */
export async function runAssessmentMigrations(pool: Pool): Promise<string> {
  const candidates = [
    join(process.cwd(), 'infra/migrations/001_assessment_playbooks.sql'),
    join(process.cwd(), '../../infra/migrations/001_assessment_playbooks.sql'),
    join(__dirname, '../../../../infra/migrations/001_assessment_playbooks.sql'),
    join(__dirname, '../../../../../infra/migrations/001_assessment_playbooks.sql'),
  ];

  let sql: string | null = null;
  let used = '';
  for (const path of candidates) {
    try {
      sql = readFileSync(path, 'utf8');
      used = path;
      break;
    } catch {
      /* try next */
    }
  }
  if (!sql) {
    throw new Error(
      'Migration 001_assessment_playbooks.sql introuvable. ' +
        'Lancer depuis monorepo root ou: pnpm --filter @annex21/api migrate',
    );
  }

  await pool.query(sql);
  return used;
}
