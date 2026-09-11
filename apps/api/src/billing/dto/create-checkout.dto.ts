import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class CreateCheckoutDto {
  /** Bande ACV du devis signé (sales-led) — 10 / 20 / 30 k€ */
  @IsIn(['10k', '20k', '30k'])
  acvTier!: '10k' | '20k' | '30k';

  @IsOptional()
  @IsBoolean()
  includeOnboardingFee?: boolean;

  /** Centimes EUR — bornes US-BILL02 : 5–15 k€ */
  @IsOptional()
  @IsInt()
  @Min(500_000)
  @Max(1_500_000)
  onboardingFeeCents?: number;
}
