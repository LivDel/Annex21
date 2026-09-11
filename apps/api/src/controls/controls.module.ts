import { Module } from '@nestjs/common';
import { ControlsController } from './controls.controller';
import { ControlsService } from './controls.service';
import { AuditModule } from '../audit/audit.module';
import { AuthStubGuard } from '../common/auth-stub.guard';
import { AppAuthGuard } from '../common/app-auth.guard';

@Module({
  imports: [AuditModule],
  controllers: [ControlsController],
  providers: [ControlsService, AuthStubGuard, AppAuthGuard],
  exports: [ControlsService],
})
export class ControlsModule {}
