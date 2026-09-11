import { Module } from '@nestjs/common';
import { EvidenceController } from './evidence.controller';
import { EvidenceService } from './evidence.service';
import { AuthStubGuard } from '../common/auth-stub.guard';

@Module({
  controllers: [EvidenceController],
  providers: [EvidenceService, AuthStubGuard],
})
export class EvidenceModule {}
