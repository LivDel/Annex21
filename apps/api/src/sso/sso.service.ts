import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import type {
  OrgIdentityProvider,
  OrgMember,
  OrgMemberRole,
  SessionUser,
  SsoLoginOptionsResponse,
  TestIdpResponse,
} from '@annex21/shared';
import { DOMAIN_STORE, type DomainStore } from '../store/domain-store';
import { SessionService } from '../session/session.service';
import { OrgsService } from '../orgs/orgs.service';
import { encryptIdpSecret } from './idp-secrets.crypto';
import { OidcService } from './oidc.service';
import { SamlService } from './saml.service';
import type { UpsertIdpDto } from './dto/upsert-idp.dto';
import { ssoFrError } from './fr-errors';
import { sanitizeAuthRedirect } from '../auth/safe-redirect';

function apiOrigin(): string {
  return (
    process.env.API_PUBLIC_URL ??
    `http://localhost:${process.env.API_PORT ?? 3001}`
  );
}

function webOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_WEB_ORIGIN ??
    process.env.API_CORS_ORIGIN ??
    'http://localhost:3000'
  );
}

function defaultDisplayName(
  protocol: string,
  provider: string,
): string {
  if (provider === 'entra') return 'Entra ID';
  if (provider === 'google') return 'Google Workspace';
  if (protocol === 'saml') return 'SAML';
  return 'SSO';
}

@Injectable()
export class SsoService {
  private readonly logger = new Logger(SsoService.name);

  constructor(
    @Inject(DOMAIN_STORE) private readonly store: DomainStore,
    private readonly sessions: SessionService,
    private readonly orgs: OrgsService,
    private readonly oidc: OidcService,
    private readonly saml: SamlService,
  ) {}

  async loginOptions(): Promise<SsoLoginOptionsResponse> {
    const connected = await this.store.listConnectedIdps();
    const options = connected.map((idp) => ({
      idpId: idp.id,
      orgId: idp.orgId,
      protocol: idp.protocol,
      provider: idp.provider,
      displayName: idp.displayName,
      startPath:
        idp.protocol === 'oidc'
          ? `/auth/sso/oidc/start?idpId=${encodeURIComponent(idp.id)}`
          : `/auth/sso/saml/start?idpId=${encodeURIComponent(idp.id)}`,
    }));

    // Soft demo presets when none connected (login still shows Entra/Google CTAs)
    if (options.length === 0) {
      return {
        options: [
          {
            idpId: 'preset_entra',
            orgId: 'org_acme',
            protocol: 'oidc',
            provider: 'entra',
            displayName: 'Entra ID',
            startPath: '/auth/sso/oidc/start?provider=entra',
          },
          {
            idpId: 'preset_google',
            orgId: 'org_acme',
            protocol: 'oidc',
            provider: 'google',
            displayName: 'Google Workspace',
            startPath: '/auth/sso/oidc/start?provider=google',
          },
        ],
        magicLinkAvailable: true,
      };
    }

    return { options, magicLinkAvailable: true };
  }

  async getIdp(orgId: string): Promise<OrgIdentityProvider | null> {
    return this.store.getIdp(orgId);
  }

  async upsertIdp(orgId: string, dto: UpsertIdpDto): Promise<OrgIdentityProvider> {
    this.assertActiveModeFields(dto);

    const displayName =
      dto.displayName?.trim() ||
      defaultDisplayName(dto.protocol, dto.provider);

    const spEntityId = `${apiOrigin()}/auth/sso/saml/metadata`;
    const acsUrl = `${apiOrigin()}/auth/sso/saml/acs`;

    let clientSecretEnc: string | undefined;
    if (dto.protocol === 'oidc' && dto.clientSecret) {
      clientSecretEnc = encryptIdpSecret(dto.clientSecret);
    }

    return this.store.upsertIdp(orgId, {
      protocol: dto.protocol,
      provider: dto.provider,
      displayName,
      issuer: dto.protocol === 'oidc' ? dto.issuer ?? null : null,
      clientId: dto.protocol === 'oidc' ? dto.clientId ?? null : null,
      clientSecretEnc,
      metadataUrl: dto.protocol === 'saml' ? dto.metadataUrl ?? null : null,
      metadataXml: dto.protocol === 'saml' ? dto.metadataXml ?? null : null,
      spEntityId: dto.protocol === 'saml' ? spEntityId : null,
      acsUrl: dto.protocol === 'saml' ? acsUrl : null,
      domains: dto.domains?.map((d) => d.trim().toLowerCase()).filter(Boolean),
      status: 'draft',
      lastError: null,
    });
  }

  async testIdp(orgId: string): Promise<TestIdpResponse> {
    const idp = await this.store.getIdp(orgId);
    if (!idp) throw new NotFoundException('IdP introuvable');

    await this.store.updateIdpStatus(idp.id, {
      status: 'testing',
      lastError: null,
    });

    let result: { ok: boolean; message: string };
    if (idp.protocol === 'oidc') {
      const full = await this.store.getIdpById(idp.id);
      let secret: string | undefined;
      try {
        if (full?.clientSecretEnc) {
          const { decryptIdpSecret } = await import('./idp-secrets.crypto');
          secret = decryptIdpSecret(full.clientSecretEnc);
        }
      } catch {
        secret = undefined;
      }
      if (!idp.issuer || !idp.clientId) {
        result = { ok: false, message: ssoFrError('config_incomplete') };
      } else {
        result = await this.oidc.probe({
          issuer: idp.issuer,
          clientId: idp.clientId,
          clientSecret: secret,
        });
      }
    } else {
      const full = await this.store.getIdpById(idp.id);
      if (!idp.metadataUrl && !full?.metadataXml) {
        result = { ok: false, message: ssoFrError('config_incomplete') };
      } else {
        result = await this.saml.probe({
          metadataUrl: idp.metadataUrl ?? undefined,
          metadataXml: full?.metadataXml ?? undefined,
        });
      }
    }

    const now = new Date().toISOString();
    if (result.ok) {
      await this.store.updateIdpStatus(idp.id, {
        status: 'connected',
        lastError: null,
        testedAt: now,
        connectedAt: now,
      });
      return { ok: true, status: 'connected', message: result.message };
    }

    await this.store.updateIdpStatus(idp.id, {
      status: 'error',
      lastError: result.message,
      testedAt: now,
    });
    return {
      ok: false,
      status: 'error',
      message: result.message || ssoFrError('test_failed'),
    };
  }

  async revokeIdp(orgId: string): Promise<OrgIdentityProvider> {
    const idp = await this.store.getIdp(orgId);
    if (!idp) throw new NotFoundException('IdP introuvable');
    const revoked = await this.store.revokeIdp(idp.id);
    if (!revoked) throw new NotFoundException('IdP introuvable');
    return revoked;
  }

  async listMembers(orgId: string): Promise<OrgMember[]> {
    return this.store.listMembers(orgId);
  }

  async updateMemberRole(
    orgId: string,
    memberId: string,
    role: OrgMemberRole,
  ): Promise<OrgMember> {
    const updated = await this.store.updateMemberRole(orgId, memberId, role);
    if (!updated) throw new NotFoundException('Membre introuvable');
    return updated;
  }

  async startOidc(input: {
    idpId?: string;
    provider?: string;
    redirect?: string;
  }): Promise<{ authorizationUrl: string }> {
    let idp =
      (input.idpId && (await this.store.getIdpById(input.idpId))) || null;

    if (!idp && input.provider) {
      // Env-based preset (dev / bootstrap before wizard) — persist so callback can resolve
      const preset = await this.resolveEnvPreset(input.provider);
      if (preset) {
        const saved = await this.store.upsertIdp(preset.orgId, {
          id: preset.id.startsWith('preset_')
            ? `idp_${input.provider}_${Date.now().toString(36)}`
            : preset.id,
          protocol: preset.protocol,
          provider: preset.provider,
          displayName: preset.displayName,
          issuer: preset.issuer,
          clientId: preset.clientId,
          clientSecretEnc: preset.clientSecretEnc,
          status: 'connected',
          domains: preset.domains,
        });
        idp = await this.store.getIdpById(saved.id);
      }
    }

    if (!idp || idp.status === 'revoked') {
      throw new NotFoundException(ssoFrError('idp_not_found'));
    }
    if (idp.protocol !== 'oidc') {
      throw new BadRequestException('Cet IdP n’est pas OIDC');
    }
    if (!idp.issuer || !idp.clientId || !idp.clientSecretEnc) {
      throw new BadRequestException(ssoFrError('config_incomplete'));
    }

    const redirectUri = `${apiOrigin()}/auth/sso/oidc/callback`;
    const started = await this.oidc.start({
      idpId: idp.id,
      orgId: idp.orgId,
      issuer: idp.issuer,
      clientId: idp.clientId,
      clientSecretEnc: idp.clientSecretEnc,
      redirectUri,
      provider: idp.provider === 'saml' ? 'entra' : idp.provider,
      redirect: input.redirect,
    });
    return { authorizationUrl: started.authorizationUrl };
  }

  async startSaml(input: {
    idpId: string;
    redirect?: string;
  }): Promise<{ redirectUrl: string }> {
    const idp = await this.store.getIdpById(input.idpId);
    if (!idp || idp.status === 'revoked') {
      throw new NotFoundException(ssoFrError('idp_not_found'));
    }
    if (idp.protocol !== 'saml') {
      throw new BadRequestException('Cet IdP n’est pas SAML');
    }
    const spEntityId =
      idp.spEntityId || `${apiOrigin()}/auth/sso/saml/metadata`;
    const acsUrl = idp.acsUrl || `${apiOrigin()}/auth/sso/saml/acs`;
    return this.saml.start({
      idpId: idp.id,
      orgId: idp.orgId,
      metadataXml: idp.metadataXml,
      metadataUrl: idp.metadataUrl,
      spEntityId,
      acsUrl,
      redirect: input.redirect,
    });
  }

  spMetadata(idpId?: string): Promise<string> | string {
    const spEntityId = `${apiOrigin()}/auth/sso/saml/metadata`;
    const acsUrl = `${apiOrigin()}/auth/sso/saml/acs`;
    return this.saml.buildSpMetadata({ spEntityId, acsUrl });
  }

  /**
   * Complete SSO login → Redis opaque session + member (default role=member).
   * Zero JIT admin: new users always member + pendingAssignment.
   */
  async completeLogin(input: {
    email: string;
    subject: string;
    displayName?: string;
    orgId: string;
    idpId: string;
  }): Promise<{ sessionId: string; user: SessionUser }> {
    const email = input.email.trim().toLowerCase();
    const idp = await this.store.getIdpById(input.idpId);
    if (!idp || idp.status === 'revoked') {
      throw Object.assign(new Error('idp_not_found'), { code: 'idp_not_found' });
    }

    if (idp.domains?.length) {
      const domain = email.split('@')[1] ?? '';
      if (!idp.domains.includes(domain)) {
        throw Object.assign(new Error('domain_denied'), {
          code: 'domain_denied',
        });
      }
    }

    const userId = `usr_${createHash('sha256').update(email).digest('hex').slice(0, 16)}`;

    // 1st SSO user = member (NOT admin); never elevate on upsert
    const member = await this.store.upsertMember({
      orgId: input.orgId,
      userId,
      email,
      displayName: input.displayName ?? null,
      role: 'member',
      pendingAssignment: true,
      idpSubject: input.subject,
      idpId: input.idpId,
    });

    const user: SessionUser = {
      id: userId,
      email,
      role: member.role,
    };

    const cachedOrgId = await this.sessions.getUserOrgId(user.id);
    const completed = await this.orgs.findCompletedForHydration(
      cachedOrgId ?? input.orgId,
    );
    const { sessionId } = await this.sessions.create(
      user,
      completed?.onboardingCompletedAt
        ? {
            orgId: completed.id,
            onboardingCompletedAt: completed.onboardingCompletedAt,
            org: {
              id: completed.id,
              name: completed.name,
              nis2Sector: completed.nis2Sector ?? '',
              cisoRole: completed.cisoRole ?? 'ciso',
            },
          }
        : { orgId: input.orgId },
    );

    await this.sessions.setUserOrgId(user.id, input.orgId);
    return { sessionId, user };
  }

  callbackErrorRedirect(code: string): string {
    const msg = encodeURIComponent(ssoFrError(code));
    return `${webOrigin()}/auth/callback?error=${encodeURIComponent(code)}&message=${msg}`;
  }

  callbackSuccessRedirect(redirect?: string): string {
    return sanitizeAuthRedirect(redirect, '/app/onboarding');
  }

  assertOwnerOrAdmin(role: string | undefined): void {
    if (role !== 'owner' && role !== 'admin') {
      throw new ForbiddenException(
        'Seuls owner/admin peuvent configurer le SSO',
      );
    }
  }

  /**
   * Wizard: only validate fields of ACTIVE mode (OIDC vs SAML).
   */
  private assertActiveModeFields(dto: UpsertIdpDto): void {
    if (dto.protocol === 'oidc') {
      if (!dto.issuer?.trim() || !dto.clientId?.trim()) {
        throw new BadRequestException({
          message: ssoFrError('config_incomplete'),
          fields: ['issuer', 'clientId'],
        });
      }
      // clientSecret required on create; optional on update (keep existing)
      return;
    }
    if (dto.protocol === 'saml') {
      if (!dto.metadataUrl?.trim() && !dto.metadataXml?.trim()) {
        throw new BadRequestException({
          message: ssoFrError('config_incomplete'),
          fields: ['metadataUrl'],
        });
      }
      return;
    }
    throw new BadRequestException('Protocol invalide');
  }

  private async resolveEnvPreset(provider: string) {
    if (provider === 'entra') {
      const tenant = process.env.SSO_ENTRA_TENANT_ID || process.env.ENTRA_TENANT_ID;
      const clientId = process.env.SSO_ENTRA_CLIENT_ID || process.env.ENTRA_CLIENT_ID;
      const secret =
        process.env.SSO_ENTRA_CLIENT_SECRET || process.env.ENTRA_CLIENT_SECRET;
      if (!tenant || !clientId || !secret) {
        throw new BadRequestException(
          'SSO Entra non configuré (wizard Owner ou variables SSO_ENTRA_*)',
        );
      }
      const enc = encryptIdpSecret(secret);
      // ephemeral view — not persisted unless wizard saves
      return {
        id: 'preset_entra',
        orgId: 'org_acme',
        protocol: 'oidc' as const,
        provider: 'entra' as const,
        status: 'connected' as const,
        displayName: 'Entra ID',
        issuer: `https://login.microsoftonline.com/${tenant}/v2.0`,
        clientId,
        hasClientSecret: true,
        clientSecretEnc: enc,
        metadataUrl: null,
        metadataXml: null,
        spEntityId: null,
        acsUrl: null,
        domains: [],
        lastError: null,
        testedAt: null,
        connectedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    if (provider === 'google') {
      const clientId =
        process.env.SSO_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
      const secret =
        process.env.SSO_GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
      if (!clientId || !secret) {
        throw new BadRequestException(
          'SSO Google non configuré (wizard Owner ou variables SSO_GOOGLE_*)',
        );
      }
      const enc = encryptIdpSecret(secret);
      return {
        id: 'preset_google',
        orgId: 'org_acme',
        protocol: 'oidc' as const,
        provider: 'google' as const,
        status: 'connected' as const,
        displayName: 'Google Workspace',
        issuer: 'https://accounts.google.com',
        clientId,
        hasClientSecret: true,
        clientSecretEnc: enc,
        metadataUrl: null,
        metadataXml: null,
        spEntityId: null,
        acsUrl: null,
        domains: [],
        lastError: null,
        testedAt: null,
        connectedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    return null;
  }
}
