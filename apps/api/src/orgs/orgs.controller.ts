import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AppAuthGuard } from '../common/app-auth.guard';
import { CreateOrgDto } from './dto/create-org.dto';
import { OrgsService } from './orgs.service';

@Controller('orgs')
@UseGuards(AppAuthGuard)
export class OrgsController {
  constructor(private readonly orgs: OrgsService) {}

  @Get()
  list() {
    return this.orgs.list();
  }

  @Get(':slug')
  getOne(@Param('slug') slug: string) {
    return this.orgs.getBySlug(slug);
  }

  @Post()
  create(@Body() dto: CreateOrgDto) {
    return this.orgs.create(dto);
  }
}
