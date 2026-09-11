import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

/**
 * Garde STUB — active UNIQUEMENT si AUTH_ALLOW_STUB=true ET NODE_ENV=development.
 * Header : Authorization: Bearer annex21-dev-stub
 * Ne pas utiliser en production.
 */
@Injectable()
export class AuthStubGuard implements CanActivate {
  static isAllowed(): boolean {
    const allow = process.env.AUTH_ALLOW_STUB === 'true';
    const isDev = (process.env.NODE_ENV ?? 'development') === 'development';
    return allow && isDev;
  }

  canActivate(context: ExecutionContext): boolean {
    if (!AuthStubGuard.isAllowed()) {
      throw new UnauthorizedException(
        'Auth stub désactivé (AUTH_ALLOW_STUB / NODE_ENV)',
      );
    }
    const req = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      user?: { id: string; email: string; role: string };
    }>();
    const header = req.headers['authorization'] ?? '';
    const expected = process.env.AUTH_STUB_TOKEN ?? 'annex21-dev-stub';
    if (header !== `Bearer ${expected}`) {
      throw new UnauthorizedException(
        'Auth stub : fournir Authorization: Bearer annex21-dev-stub',
      );
    }
    req.user = {
      id: 'usr_stub',
      email: 'ciso@acme.example',
      role: 'owner',
    };
    return true;
  }
}
