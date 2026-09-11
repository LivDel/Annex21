import { Global, Module, OnModuleInit, Inject, Logger } from '@nestjs/common';
import { PgModule } from '../db/pg.module';
import { PgService } from '../db/pg.service';
import { DOMAIN_STORE, type DomainStore } from './domain-store';
import { MemoryDomainStore } from './memory.domain-store';
import { PostgresDomainStore } from './postgres.domain-store';

/**
 * Provides DOMAIN_STORE: Postgres when PgService connected, else in-memory.
 * Selection happens after PgService.onModuleInit (same Nest init wave — we
 * re-check lazily via a thin proxy).
 */
class DomainStoreProxy implements DomainStore {
  private impl: DomainStore;
  private readonly logger = new Logger('DomainStore');

  constructor(private readonly pg: PgService) {
    this.impl = new MemoryDomainStore();
  }

  /** Call after PgService init to bind Postgres backend if available. */
  bind(): void {
    if (this.pg.isPostgres()) {
      this.impl = new PostgresDomainStore(this.pg);
      this.logger.log('Domain store backend: postgres (EU)');
    } else {
      this.impl = new MemoryDomainStore();
      this.logger.warn('Domain store backend: memory (dev fallback)');
    }
  }

  get mode() {
    return this.impl.mode;
  }

  listAssessments(orgId?: string) {
    return this.impl.listAssessments(orgId);
  }
  getAssessment(id: string) {
    return this.impl.getAssessment(id);
  }
  createAssessment(input: Parameters<DomainStore['createAssessment']>[0]) {
    return this.impl.createAssessment(input);
  }
  saveAssessment(row: Parameters<DomainStore['saveAssessment']>[0]) {
    return this.impl.saveAssessment(row);
  }
  listControls(orgId?: string) {
    return this.impl.listControls(orgId);
  }
  getControl(id: string) {
    return this.impl.getControl(id);
  }
  updateControl(id: string, patch: Parameters<DomainStore['updateControl']>[1]) {
    return this.impl.updateControl(id, patch);
  }
  listPlaybookTemplates() {
    return this.impl.listPlaybookTemplates();
  }
  getPlaybookTemplate(id: string) {
    return this.impl.getPlaybookTemplate(id);
  }
  listIncidents(orgId?: string) {
    return this.impl.listIncidents(orgId);
  }
  getIncident(id: string) {
    return this.impl.getIncident(id);
  }
  createIncident(row: Parameters<DomainStore['createIncident']>[0]) {
    return this.impl.createIncident(row);
  }
  saveIncident(row: Parameters<DomainStore['saveIncident']>[0]) {
    return this.impl.saveIncident(row);
  }

  getTrustBySlug(orgSlug: string) {
    return this.impl.getTrustBySlug(orgSlug);
  }
  saveTrust(row: Parameters<DomainStore['saveTrust']>[0]) {
    return this.impl.saveTrust(row);
  }
  patchTrustDraft(
    orgSlug: string,
    patch: Parameters<DomainStore['patchTrustDraft']>[1],
  ) {
    return this.impl.patchTrustDraft(orgSlug, patch);
  }

  appendAudit(input: Parameters<DomainStore['appendAudit']>[0]) {
    return this.impl.appendAudit(input);
  }
  listAudit(orgId?: string, limit?: number) {
    return this.impl.listAudit(orgId, limit);
  }

  getBilling(orgId: string) {
    return this.impl.getBilling(orgId);
  }
  upsertBilling(
    orgId: string,
    patch: Parameters<DomainStore['upsertBilling']>[1],
  ) {
    return this.impl.upsertBilling(orgId, patch);
  }
  findOrgIdByStripeCustomer(customerId: string) {
    return this.impl.findOrgIdByStripeCustomer(customerId);
  }
  claimWebhookEvent(
    eventId: string,
    eventType: string,
    orgId?: string | null,
  ) {
    return this.impl.claimWebhookEvent(eventId, eventType, orgId);
  }
}

@Global()
@Module({
  imports: [PgModule],
  providers: [
    {
      provide: DOMAIN_STORE,
      useFactory: (pg: PgService) => {
        const proxy = new DomainStoreProxy(pg);
        return proxy;
      },
      inject: [PgService],
    },
  ],
  exports: [DOMAIN_STORE],
})
export class StoreModule implements OnModuleInit {
  private readonly logger = new Logger(StoreModule.name);

  constructor(
    private readonly pg: PgService,
    @Inject(DOMAIN_STORE) private readonly store: DomainStoreProxy,
  ) {}

  onModuleInit(): void {
    // PgService.onModuleInit runs before this (imported module first).
    this.store.bind();
    this.logger.log(`Store ready (mode=${this.store.mode})`);
  }
}
