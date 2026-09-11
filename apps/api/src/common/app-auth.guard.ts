import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SessionGuard } from '../session/session.guard';
import { AuthStubGuard } from './auth-stub.guard';

/**
 * Garde composite : Session cookie Redis d'abord ;
 * fallback Bearer stub uniquement si AUTH_ALLOW_STUB=true + development.
 */
@Injectable()
export class AppAuthGuard implements CanActivate {
  constructor(
    private readonly sessionGuard: SessionGuard,
    private readonly stubGuard: AuthStubGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      return await this.sessionGuard.canActivate(context);
    } catch (sessionErr) {
      if (AuthStubGuard.isAllowed()) {
        try {
          return this.stubGuard.canActivate(context);
        } catch {
          /* fall through */
        }
      }
      if (sessionErr instanceof UnauthorizedException) {
        throw sessionErr;
      }
      throw new UnauthorizedException('Authentification requise');
    }
  }
}
