import { Module } from '@nestjs/common';
import { OrgsController } from './orgs.controller';
import { OrgsService } from './orgs.service';
import { AuthStubGuard } from '../common/auth-stub.guard';
import { AppAuthGuard } from '../common/app-auth.guard';

@Module({
  controllers: [OrgsController],
  providers: [OrgsService, AuthStubGuard, AppAuthGuard],
  exports: [OrgsService],
})
export class OrgsModule {}
