import { IsArray, IsOptional, IsString } from 'class-validator';

export class CompleteStepDto {
  /** Preuves à lier avant complete (si requires_evidence). */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  evidenceIds?: string[];
}
