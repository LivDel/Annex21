import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthStubGuard } from '../common/auth-stub.guard';
import { CreateEvidenceDto } from './dto/create-evidence.dto';
import { EvidenceService } from './evidence.service';

/**
 * Routes PRIVÉES uniquement.
 * Aucun équivalent /public/evidence — par conception (RG-08).
 */
@Controller('evidence')
@UseGuards(AuthStubGuard)
export class EvidenceController {
  constructor(private readonly evidence: EvidenceService) {}

  @Get()
  list(@Query('orgId') orgId?: string) {
    return this.evidence.list(orgId);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.evidence.getById(id);
  }

  @Post()
  create(@Body() dto: CreateEvidenceDto) {
    return this.evidence.create(dto);
  }
}
