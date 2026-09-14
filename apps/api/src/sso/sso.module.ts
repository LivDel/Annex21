import { Module } from '@nestjs/common';
import { SsoService } from './sso.service';
import { OidcService } from './oidc.service';
import { SamlService } from './saml.service';
import { SsoAuthController } from './sso-auth.controller';
import { SsoAdminController } from './sso-admin.controller';
import { OrgsModule } from '../orgs/orgs.module';
import { AuthStubGuard } from '../common/auth-stub.guard';
import { AppAuthGuard } from '../common/app-auth.guard';

@Module({
  imports: [OrgsModule],
  controllers: [SsoAuthController, SsoAdminController],
  providers: [
    SsoService,
    OidcService,
    SamlService,
    AuthStubGuard,
    AppAuthGuard,
  ],
  exports: [SsoService],
})
export class SsoModule {}
