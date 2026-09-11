import { Module } from '@nestjs/common';
import { ConnectorsController } from './connectors.controller';
import { ConnectorsService } from './connectors.service';
import { EvidenceModule } from '../evidence/evidence.module';
import { AuthStubGuard } from '../common/auth-stub.guard';
import { AppAuthGuard } from '../common/app-auth.guard';

@Module({
  imports: [EvidenceModule],
  controllers: [ConnectorsController],
  providers: [ConnectorsService, AuthStubGuard, AppAuthGuard],
  exports: [ConnectorsService],
})
export class ConnectorsModule {}
