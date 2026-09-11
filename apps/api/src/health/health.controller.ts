import { Controller, Get } from '@nestjs/common';
import { DATA_RESIDENCY } from '../common/eu-residency';

@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return {
      ok: true,
      service: 'annex21-api',
      dataResidency: DATA_RESIDENCY,
      timestamp: new Date().toISOString(),
    };
  }
}
