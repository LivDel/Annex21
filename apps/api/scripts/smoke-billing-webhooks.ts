/**
 * Soft billing webhook fixtures smoke (dev only).
 *
 * Usage (monorepo root):
 *   BILLING_WEBHOOK_FIXTURES=1 pnpm --filter @annex21/api smoke:billing-webhooks
 *
 * Fail-closed: refuses to run when NODE_ENV=production.
 * No live Stripe keys — synthetic events → claimWebhookEvent + same handlers.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { BillingService } from '../src/billing/billing.service';
import {
  assertBillingWebhookFixturesAllowed,
  FIXTURE_DEFAULT_ORG_ID,
} from '../src/billing/billing-webhook-fixtures';

/** Minimal .env loader (no dotenv dep) — does not override existing process.env. */
function loadEnvFile(filePath: string): void {
  if (!existsSync(filePath)) return;
  const text = readFileSync(filePath, 'utf8');
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

async function main() {
  const root = resolve(__dirname, '../../..');
  loadEnvFile(resolve(root, '.env'));
  loadEnvFile(resolve(__dirname, '../.env'));

  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
  }
  // Script always opts into fixtures for the smoke run (still fail-closed in prod).
  process.env.BILLING_WEBHOOK_FIXTURES = '1';

  assertBillingWebhookFixturesAllowed();

  const orgId =
    process.env.BILLING_FIXTURE_ORG_ID?.trim() || FIXTURE_DEFAULT_ORG_ID;
  const runId =
    process.env.BILLING_FIXTURE_RUN_ID?.trim() ||
    `smoke_${Date.now().toString(36)}`;

  // eslint-disable-next-line no-console
  console.log(
    `[smoke:billing-webhooks] org=${orgId} runId=${runId} NODE_ENV=${process.env.NODE_ENV}`,
  );

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  let exitCode = 0;
  try {
    const billing = app.get(BillingService);
    const result = await billing.runFixtureSmoke({ orgId, runId });

    // eslint-disable-next-line no-console
    console.log('[smoke:billing-webhooks] forward steps:');
    for (const s of result.steps) {
      const mark =
        s.statusAfter === s.expectedStatus && !s.duplicate ? 'OK' : 'FAIL';
      // eslint-disable-next-line no-console
      console.log(
        `  [${mark}] ${s.key} → ${s.statusAfter} (expect ${s.expectedStatus}) id=${s.eventId}`,
      );
    }

    // eslint-disable-next-line no-console
    console.log('[smoke:billing-webhooks] idempotent replay:');
    for (const s of result.replay) {
      const mark = s.duplicate ? 'OK' : 'FAIL';
      // eslint-disable-next-line no-console
      console.log(
        `  [${mark}] ${s.key} duplicate=${s.duplicate} status=${s.statusAfter}`,
      );
    }

    // eslint-disable-next-line no-console
    console.log(
      '[smoke:billing-webhooks] UX journey: empty→pending→active+factures→past_due+Réessayer→canceled→empty soft',
    );

    if (!result.ok) {
      // eslint-disable-next-line no-console
      console.error('[smoke:billing-webhooks] FAILED');
      exitCode = 1;
    } else {
      // eslint-disable-next-line no-console
      console.log('[smoke:billing-webhooks] OK');
    }
  } finally {
    // ioredis may keep reconnecting after failed connect — force exit.
    await Promise.race([
      app.close(),
      new Promise<void>((r) => setTimeout(r, 1500)),
    ]);
  }
  process.exit(exitCode);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
