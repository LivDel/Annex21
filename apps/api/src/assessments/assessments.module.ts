import { Module } from '@nestjs/common';
import { AssessmentsController } from './assessments.controller';
import { AssessmentsService } from './assessments.service';
import { AuditModule } from '../audit/audit.module';
import { AuthStubGuard } from '../common/auth-stub.guard';
import { AppAuthGuard } from '../common/app-auth.guard';

@Module({
  imports: [AuditModule],
  controllers: [AssessmentsController],
  providers: [AssessmentsService, AuthStubGuard, AppAuthGuard],
  exports: [AssessmentsService],
})
export class AssessmentsModule {}
