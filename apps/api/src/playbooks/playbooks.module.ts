import { Module } from '@nestjs/common';
import { PlaybooksController } from './playbooks.controller';
import { PlaybooksService } from './playbooks.service';
import { AuthStubGuard } from '../common/auth-stub.guard';
import { AppAuthGuard } from '../common/app-auth.guard';

@Module({
  controllers: [PlaybooksController],
  providers: [PlaybooksService, AuthStubGuard, AppAuthGuard],
  exports: [PlaybooksService],
})
export class PlaybooksModule {}
