import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RequestMagicLinkDto } from './dto/request-magic-link.dto';

@Controller('auth/magic-link')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('request')
  request(@Body() dto: RequestMagicLinkDto) {
    return this.auth.requestMagicLink(dto.email);
  }

  @Get('verify')
  verify(@Query('token') token: string) {
    return this.auth.verifyMagicLink(token ?? '');
  }
}
