import { Module } from '@nestjs/common';
import { OrgsController } from './orgs.controller';
import { OrgsService } from './orgs.service';
import { AuthStubGuard } from '../common/auth-stub.guard';

@Module({
  controllers: [OrgsController],
  providers: [OrgsService, AuthStubGuard],
})
export class OrgsModule {}
