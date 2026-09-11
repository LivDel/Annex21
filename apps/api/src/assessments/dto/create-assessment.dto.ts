import { IsObject, IsOptional, IsString } from 'class-validator';
import type { AssessmentAnswers } from '@annex21/shared';

export class CreateAssessmentDto {
  @IsString()
  orgId!: string;

  @IsOptional()
  @IsObject()
  answers?: AssessmentAnswers;
}
