import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { TrustModule } from './trust/trust.module';
import { EvidenceModule } from './evidence/evidence.module';
import { OrgsModule } from './orgs/orgs.module';

/**
 * Module racine Annex21.
 * Data residency EU (RG-10) : ConfigModule ne doit pas pointer vers des stores hors UE.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HealthModule,
    AuthModule,
    TrustModule,
    EvidenceModule,
    OrgsModule,
  ],
})
export class AppModule {}
