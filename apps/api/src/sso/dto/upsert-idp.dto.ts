import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import type { SsoProtocol, SsoProviderKind } from '@annex21/shared';

/**
 * Wizard validation: only fields of the ACTIVE mode (OIDC vs SAML).
 * Soft UX — unused mode fields are ignored, not required.
 */
export class UpsertIdpDto {
  @IsIn(['oidc', 'saml'])
  protocol!: SsoProtocol;

  @IsIn(['entra', 'google', 'saml'])
  provider!: SsoProviderKind;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  displayName?: string;

  /** OIDC only */
  @ValidateIf((o: UpsertIdpDto) => o.protocol === 'oidc')
  @IsString()
  @MaxLength(512)
  issuer?: string;

  @ValidateIf((o: UpsertIdpDto) => o.protocol === 'oidc')
  @IsString()
  @MaxLength(256)
  clientId?: string;

  @ValidateIf((o: UpsertIdpDto) => o.protocol === 'oidc')
  @IsOptional()
  @IsString()
  @MaxLength(512)
  clientSecret?: string;

  /** SAML only */
  @ValidateIf((o: UpsertIdpDto) => o.protocol === 'saml')
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  metadataUrl?: string;

  @ValidateIf((o: UpsertIdpDto) => o.protocol === 'saml')
  @IsOptional()
  @IsString()
  @MaxLength(200_000)
  metadataXml?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  domains?: string[];
}
