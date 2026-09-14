import { Injectable, Logger } from '@nestjs/common';
import { SAML } from '@node-saml/node-saml';
import { randomBytes } from 'crypto';
import { lookup } from 'dns/promises';
import { isIP } from 'net';
import { RedisService } from '../session/redis.service';

const STATE_PREFIX = 'sso_saml:';
const STATE_TTL = 10 * 60;
const METADATA_FETCH_TIMEOUT_MS = 8_000;
const METADATA_MAX_REDIRECTS = 3;

export interface SamlCallbackResult {
  email: string;
  subject: string;
  displayName?: string;
  orgId: string;
  idpId: string;
  redirect?: string;
}

@Injectable()
export class SamlService {
  private readonly logger = new Logger(SamlService.name);

  constructor(private readonly redis: RedisService) {}

  async start(input: {
    idpId: string;
    orgId: string;
    metadataXml?: string | null;
    metadataUrl?: string | null;
    spEntityId: string;
    acsUrl: string;
    redirect?: string;
  }): Promise<{ redirectUrl: string }> {
    const xml = await this.resolveMetadataXml(input.metadataXml, input.metadataUrl);
    const idp = parseIdpFromMetadata(xml);
    const saml = this.buildSaml({
      entryPoint: idp.entryPoint,
      idpCert: idp.cert,
      spEntityId: input.spEntityId,
      acsUrl: input.acsUrl,
    });

    const relay = randomBytes(16).toString('base64url');
    await this.redis.set(
      `${STATE_PREFIX}${relay}`,
      JSON.stringify({
        idpId: input.idpId,
        orgId: input.orgId,
        redirect: input.redirect,
        spEntityId: input.spEntityId,
        acsUrl: input.acsUrl,
        entryPoint: idp.entryPoint,
        idpCert: idp.cert,
      }),
      STATE_TTL,
    );

    const authorize = await saml.getAuthorizeUrlAsync(relay, undefined, {});
    return { redirectUrl: authorize };
  }

  async handleAcs(input: {
    samlResponse: string;
    relayState?: string;
  }): Promise<SamlCallbackResult> {
    if (!input.relayState) {
      throw Object.assign(new Error('invalid_state'), { code: 'invalid_state' });
    }
    const raw = await this.redis.getDel(`${STATE_PREFIX}${input.relayState}`);
    if (!raw) {
      throw Object.assign(new Error('invalid_state'), { code: 'invalid_state' });
    }

    let saved: {
      idpId: string;
      orgId: string;
      redirect?: string;
      spEntityId: string;
      acsUrl: string;
      entryPoint: string;
      idpCert: string;
    };
    try {
      saved = JSON.parse(raw);
    } catch {
      throw Object.assign(new Error('invalid_state'), { code: 'invalid_state' });
    }

    try {
      const saml = this.buildSaml({
        entryPoint: saved.entryPoint,
        idpCert: saved.idpCert,
        spEntityId: saved.spEntityId,
        acsUrl: saved.acsUrl,
      });
      const { profile } = await saml.validatePostResponseAsync({
        SAMLResponse: input.samlResponse,
      });
      if (!profile) {
        throw Object.assign(new Error('saml_validate'), { code: 'saml_validate' });
      }

      const email = extractEmail(profile);
      if (!email) {
        throw Object.assign(new Error('saml_claims'), { code: 'saml_claims' });
      }

      return {
        email,
        subject: String(profile.nameID || profile.nameId || email),
        displayName:
          (profile.displayName as string | undefined) ||
          (profile.cn as string | undefined),
        orgId: saved.orgId,
        idpId: saved.idpId,
        redirect: saved.redirect,
      };
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === 'saml_claims' || code === 'saml_validate') throw err;
      this.logger.warn(`SAML ACS failed: ${String(err)}`);
      throw Object.assign(new Error('saml_validate'), { code: 'saml_validate' });
    }
  }

  buildSpMetadata(input: { spEntityId: string; acsUrl: string }): string {
    const entityId = escapeXml(input.spEntityId);
    const acs = escapeXml(input.acsUrl);
    return `<?xml version="1.0"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" entityID="${entityId}">
  <SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol" AuthnRequestsSigned="false" WantAssertionsSigned="true">
    <NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</NameIDFormat>
    <AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${acs}" index="0" isDefault="true"/>
  </SPSSODescriptor>
</EntityDescriptor>`;
  }

  async probe(input: {
    metadataUrl?: string;
    metadataXml?: string;
  }): Promise<{ ok: boolean; message: string }> {
    try {
      const xml = await this.resolveMetadataXml(
        input.metadataXml,
        input.metadataUrl,
      );
      const idp = parseIdpFromMetadata(xml);
      if (!idp.entryPoint || !idp.cert) {
        return { ok: false, message: 'Métadonnées SAML incomplètes' };
      }
      return { ok: true, message: 'Métadonnées SAML valides' };
    } catch (err) {
      this.logger.warn(`SAML probe failed: ${String(err)}`);
      return {
        ok: false,
        message: 'Métadonnées inaccessibles ou invalides',
      };
    }
  }

  private buildSaml(input: {
    entryPoint: string;
    idpCert: string;
    spEntityId: string;
    acsUrl: string;
  }): SAML {
    return new SAML({
      entryPoint: input.entryPoint,
      idpCert: input.idpCert,
      issuer: input.spEntityId,
      callbackUrl: input.acsUrl,
      wantAssertionsSigned: true,
      wantAuthnResponseSigned: false,
      identifierFormat:
        'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
    });
  }

  private async resolveMetadataXml(
    metadataXml?: string | null,
    metadataUrl?: string | null,
  ): Promise<string> {
    if (metadataXml && metadataXml.trim()) return metadataXml.trim();
    if (!metadataUrl) {
      throw new Error('metadata_required');
    }
    return fetchMetadataUrlSafe(metadataUrl);
  }
}

async function fetchMetadataUrlSafe(urlStr: string): Promise<string> {
  let current = urlStr.trim();
  for (let hop = 0; hop <= METADATA_MAX_REDIRECTS; hop++) {
    const url = await assertSafeHttpsMetadataUrl(current);
    const res = await fetch(url.toString(), {
      redirect: 'manual',
      signal: AbortSignal.timeout(METADATA_FETCH_TIMEOUT_MS),
      headers: {
        Accept: 'application/samlmetadata+xml, application/xml, text/xml, */*',
      },
    });

    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location');
      if (!loc) throw new Error(`metadata_http_${res.status}`);
      current = new URL(loc, url).toString();
      continue;
    }
    if (!res.ok) throw new Error(`metadata_http_${res.status}`);
    return await res.text();
  }
  throw new Error('metadata_redirects');
}

async function assertSafeHttpsMetadataUrl(urlStr: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(urlStr);
  } catch {
    throw new Error('metadata_url_invalid');
  }
  if (url.protocol !== 'https:') {
    throw new Error('metadata_https_only');
  }
  if (url.username || url.password) {
    throw new Error('metadata_url_invalid');
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (
    hostname === 'localhost' ||
    hostname === 'metadata.google.internal' ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.localhost') ||
    hostname === 'metadata' ||
    hostname === 'instance-data'
  ) {
    throw new Error('metadata_url_blocked');
  }

  const addresses =
    isIP(hostname) > 0
      ? [hostname]
      : (await lookup(hostname, { all: true, verbatim: true })).map(
          (r) => r.address,
        );

  if (!addresses.length || addresses.some(isBlockedIp)) {
    throw new Error('metadata_url_blocked');
  }
  return url;
}

function isBlockedIp(ip: string): boolean {
  const v = ip.toLowerCase();
  if (v.includes(':')) {
    if (v === '::1' || v === '::' || v === '0:0:0:0:0:0:0:1') return true;
    if (v.startsWith('fc') || v.startsWith('fd')) return true;
    if (v.startsWith('fe80')) return true;
    if (v.startsWith('ff')) return true;
    if (v.startsWith('::ffff:')) {
      return isBlockedIp(v.slice('::ffff:'.length));
    }
    return false;
  }

  const parts = v.split('.').map((p) => Number(p));
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return true;
  }
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  if (a >= 224) return true;
  return false;
}

function parseIdpFromMetadata(xml: string): { entryPoint: string; cert: string } {
  const entry =
    xml.match(
      /<SingleSignOnService[^>]*Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"[^>]*Location="([^"]+)"/i,
    ) ||
    xml.match(
      /<SingleSignOnService[^>]*Location="([^"]+)"[^>]*Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"/i,
    ) ||
    xml.match(/<SingleSignOnService[^>]*Location="([^"]+)"/i);
  const cert = xml.match(
    /<X509Certificate>([^<]+)<\/X509Certificate>/i,
  );
  if (!entry || !cert) {
    throw new Error('metadata_parse');
  }
  return {
    entryPoint: entry[1],
    cert: cert[1].replace(/\s+/g, ''),
  };
}

function extractEmail(profile: Record<string, unknown>): string | null {
  const candidates = [
    profile.email,
    profile.mail,
    profile.nameID,
    profile.nameId,
    (profile.attributes as Record<string, unknown> | undefined)?.email,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.includes('@')) {
      return c.trim().toLowerCase();
    }
  }
  return null;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
