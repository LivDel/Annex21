import { Module } from '@nestjs/common';
import { EvidenceController } from './evidence.controller';
import { EvidenceService } from './evidence.service';
import { AuthStubGuard } from '../common/auth-stub.guard';
import { AppAuthGuard } from '../common/app-auth.guard';

@Module({
  controllers: [EvidenceController],
  providers: [EvidenceService, AuthStubGuard, AppAuthGuard],
  exports: [EvidenceService],
})
export class EvidenceModule {}
