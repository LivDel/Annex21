import { IsIn, IsString, Matches, MinLength } from 'class-validator';

export class CreateOrgDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @Matches(/^[a-z0-9-]+$/)
  slug!: string;

  @IsIn(['FR', 'DE', 'AT', 'CH'])
  country!: 'FR' | 'DE' | 'AT' | 'CH';
}
