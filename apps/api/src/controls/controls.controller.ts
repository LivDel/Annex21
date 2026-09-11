import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AppAuthGuard } from '../common/app-auth.guard';
import type { AuthedRequest } from '../session/session.guard';
import { ControlsService } from './controls.service';
import { UpdateControlDto } from './dto/update-control.dto';

@Controller('controls')
@UseGuards(AppAuthGuard)
export class ControlsController {
  constructor(private readonly controls: ControlsService) {}

  @Get()
  list(@Query('orgId') orgId?: string) {
    return this.controls.list(orgId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateControlDto,
    @Req() req: AuthedRequest,
  ) {
    return this.controls.update(id, dto, req.user?.id);
  }
}
