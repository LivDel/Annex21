import { Controller, Get, Param } from '@nestjs/common';
import { TrustService } from './trust.service';

/**
 * Contrôleur PUBLIC du Trust Center.
 * RG-07 : published only. RG-08 : pas de preuves brutes.
 * Pas de garde auth — contenu destiné aux acheteurs externes.
 */
@Controller('public/trust')
export class TrustPublicController {
  constructor(private readonly trust: TrustService) {}

  @Get(':orgSlug')
  getPublic(@Param('orgSlug') orgSlug: string) {
    return this.trust.getPublicBySlug(orgSlug);
  }
}
