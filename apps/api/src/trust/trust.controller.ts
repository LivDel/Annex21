import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthStubGuard } from '../common/auth-stub.guard';
import { PublishTrustDto } from './dto/publish-trust.dto';
import { TrustService } from './trust.service';

/**
 * Contrôleur authentifié (stub) du Trust Center.
 * Peut renvoyer un draft. Ne joint JAMAIS l'evidence (routes /evidence dédiées).
 */
@Controller('trust')
@UseGuards(AuthStubGuard)
export class TrustController {
  constructor(private readonly trust: TrustService) {}

  @Get(':orgSlug')
  getOne(@Param('orgSlug') orgSlug: string) {
    return this.trust.getAuthenticated(orgSlug);
  }

  @Post(':orgSlug/publish')
  publish(@Param('orgSlug') orgSlug: string, @Body() _dto: PublishTrustDto) {
    return this.trust.publish(orgSlug);
  }
}
