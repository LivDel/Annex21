import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { SessionService } from './session.service';
import { SessionGuard } from './session.guard';

/**
 * Sessions Redis in-EU (RG-10). Global pour SessionGuard sur orgs/trust/evidence/connectors.
 */
@Global()
@Module({
  providers: [RedisService, SessionService, SessionGuard],
  exports: [RedisService, SessionService, SessionGuard],
})
export class SessionModule {}
