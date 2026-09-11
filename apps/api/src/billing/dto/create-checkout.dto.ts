import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

export class CreateCheckoutDto {
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
