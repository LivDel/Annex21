import { IsIn, IsString, MinLength } from 'class-validator';

export class CompleteOnboardingDto {
  @IsString()
  @MinLength(2)
  orgName!: string;

  @IsString()
  @MinLength(2)
  nis2Sector!: string;

  @IsIn(['ciso', 'contributor', 'viewer'])
  cisoRole!: 'ciso' | 'contributor' | 'viewer';
}
