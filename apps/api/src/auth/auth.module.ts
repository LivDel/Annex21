import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import {
  MAGIC_LINK_EMAIL,
  type MagicLinkEmailService,
} from './email/magic-link-email.interface';
import { BrevoHttpEmailService } from './email/brevo-http.email';
import { MagicLinkEmailServiceDev } from './email/dev-stub.email';
import { OrgsModule } from '../orgs/orgs.module';

function emailProvider(): MagicLinkEmailService {
  const configured = Boolean(
    process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL,
  );
  if (configured) {
    return new BrevoHttpEmailService();
  }
  return new MagicLinkEmailServiceDev();
}

@Module({
  imports: [OrgsModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    BrevoHttpEmailService,
    MagicLinkEmailServiceDev,
    {
      provide: MAGIC_LINK_EMAIL,
      useFactory: emailProvider,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
