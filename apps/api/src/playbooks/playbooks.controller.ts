import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AppAuthGuard } from '../common/app-auth.guard';
import { PlaybooksService } from './playbooks.service';

@Controller('playbooks')
@UseGuards(AppAuthGuard)
export class PlaybooksController {
  constructor(private readonly playbooks: PlaybooksService) {}

  @Get('templates')
  listTemplates() {
    return this.playbooks.listTemplates();
  }

  @Get('templates/:id')
  getTemplate(@Param('id') id: string) {
    return this.playbooks.getTemplate(id);
  }
}
