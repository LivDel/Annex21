import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AppAuthGuard } from '../common/app-auth.guard';
import { AuditService } from './audit.service';

@Controller('audit-events')
@UseGuards(AppAuthGuard)
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  list(@Query('orgId') orgId?: string, @Query('limit') limit?: string) {
    return this.audit.list(orgId, limit ? Number(limit) : 100);
  }
}
