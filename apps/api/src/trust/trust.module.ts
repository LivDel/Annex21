import { Module } from '@nestjs/common';
import { TrustController } from './trust.controller';
import { TrustPublicController } from './trust.public.controller';
import { TrustService } from './trust.service';
import { AuthStubGuard } from '../common/auth-stub.guard';

@Module({
  controllers: [TrustPublicController, TrustController],
  providers: [TrustService, AuthStubGuard],
})
export class TrustModule {}
