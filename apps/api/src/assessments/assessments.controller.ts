import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AppAuthGuard } from '../common/app-auth.guard';
import type { AuthedRequest } from '../session/session.guard';
import { AssessmentsService } from './assessments.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';
import { CompleteAssessmentDto } from './dto/complete-assessment.dto';

/**
 * Assessment NIS2 — routes privées uniquement (SessionGuard / AppAuthGuard).
 * Jamais monté sur /public/trust (RG-07).
 */
@Controller('assessments')
@UseGuards(AppAuthGuard)
export class AssessmentsController {
  constructor(private readonly assessments: AssessmentsService) {}

  @Get()
  list(@Query('orgId') orgId?: string) {
    return this.assessments.list(orgId);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.assessments.getById(id);
  }

  @Post()
  create(@Body() dto: CreateAssessmentDto, @Req() req: AuthedRequest) {
    return this.assessments.create(dto, req.user?.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAssessmentDto,
    @Req() req: AuthedRequest,
  ) {
    return this.assessments.update(id, dto, req.user?.id);
  }

  @Post(':id/complete')
  complete(
    @Param('id') id: string,
    @Body() _dto: CompleteAssessmentDto,
    @Req() req: AuthedRequest,
  ) {
    // ValidationPipe + @Equals(true) sur disclaimer_ack
    return this.assessments.complete(id, req.user?.id);
  }
}
