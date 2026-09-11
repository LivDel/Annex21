import { Equals, IsOptional, IsString } from 'class-validator';

/**
 * Publish gated V1 — disclaimer_ack obligatoire (checklist).
 * Publish n'est jamais automatique.
 */
export class PublishTrustDto {
  @Equals(true, {
    message: 'disclaimer_ack doit être true pour publier le Trust Center',
  })
  disclaimer_ack!: true;

  @IsOptional()
  @IsString()
  notes?: string;
}
