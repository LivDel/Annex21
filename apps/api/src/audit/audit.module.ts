import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { AuthStubGuard } from '../common/auth-stub.guard';
import { AppAuthGuard } from '../common/app-auth.guard';

@Module({
  controllers: [AuditController],
  providers: [AuditService, AuthStubGuard, AppAuthGuard],
  exports: [AuditService],
})
export class AuditModule {}
