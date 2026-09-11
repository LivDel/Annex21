import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateEvidenceDto {
  @IsString()
  orgId!: string;

  @IsString()
  @MinLength(1)
  filename!: string;

  @IsIn(['manual', 'connector'])
  provenance!: 'manual' | 'connector';

  @IsOptional()
  @IsString()
  controlId?: string;
}
