import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

/** PATCH brouillon Trust — jamais d'evidence / upload. */
export class PatchTrustDraftDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  orgName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  country?: string;

  @IsOptional()
  @IsIn(['fr', 'en', 'de'])
  locale?: 'fr' | 'en' | 'de';

  @IsOptional()
  @IsBoolean()
  disclaimerAck?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  unpublishedNotes?: string;
}
