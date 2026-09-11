import { Module } from '@nestjs/common';
import { IncidentsController } from './incidents.controller';
import { IncidentsService } from './incidents.service';
import { AuditModule } from '../audit/audit.module';
import { PlaybooksModule } from '../playbooks/playbooks.module';
import { EvidenceModule } from '../evidence/evidence.module';
import { AuthStubGuard } from '../common/auth-stub.guard';
import { AppAuthGuard } from '../common/app-auth.guard';

@Module({
  imports: [AuditModule, PlaybooksModule, EvidenceModule],
  controllers: [IncidentsController],
  providers: [IncidentsService, AuthStubGuard, AppAuthGuard],
  exports: [IncidentsService],
})
export class IncidentsModule {}
