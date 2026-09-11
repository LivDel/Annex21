import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

/**
 * Garde d'authentification STUB (MVP).
 * Header attendu : Authorization: Bearer <AUTH_STUB_TOKEN>
 * Remplacer par JWT + SSO (SAML/OIDC) avant fin de MVP (RG-14).
 */
@Injectable()
export class AuthStubGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined> }>();
    const header = req.headers['authorization'] ?? '';
    const expected = process.env.AUTH_STUB_TOKEN ?? 'annex21-dev-stub';
    if (header !== `Bearer ${expected}`) {
      throw new UnauthorizedException(
        'Auth stub : fournir Authorization: Bearer annex21-dev-stub',
      );
    }
    return true;
  }
}
