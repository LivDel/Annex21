import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { SessionModule } from './session/session.module';
import { AuthModule } from './auth/auth.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { TrustModule } from './trust/trust.module';
import { EvidenceModule } from './evidence/evidence.module';
import { OrgsModule } from './orgs/orgs.module';
import { ConnectorsModule } from './connectors/connectors.module';
import { AuditModule } from './audit/audit.module';
import { AssessmentsModule } from './assessments/assessments.module';
import { ControlsModule } from './controls/controls.module';
import { PlaybooksModule } from './playbooks/playbooks.module';
import { IncidentsModule } from './incidents/incidents.module';
import { PgModule } from './db/pg.module';
import { StoreModule } from './store/store.module';
import { BillingModule } from './billing/billing.module';

/**
 * Module racine Annex21.
 * Data residency EU (RG-10) : ConfigModule ne doit pas pointer vers des stores hors UE.
 * Assessment / incidents / evidence : uniquement via AppAuthGuard — jamais /public/trust (RG-07).
 * Onboarding server gate : orgs.onboarding_completed_at + OnboardingGuard sur connectors / assessments / incidents / trust writes.
 * Store : Postgres (DATABASE_URL / POSTGRES_*) avec fallback in-memory loggé en dev.
 * Billing ACV : Stripe Checkout Sessions + webhooks signés (secrets EU, jamais NEXT_PUBLIC_*).
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PgModule,
    StoreModule,
    SessionModule,
    HealthModule,
    AuthModule,
    OnboardingModule,
    TrustModule,
    EvidenceModule,
    OrgsModule,
    ConnectorsModule,
    AuditModule,
    AssessmentsModule,
    ControlsModule,
    PlaybooksModule,
    IncidentsModule,
    BillingModule,
  ],
})
export class AppModule {}
