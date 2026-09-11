import { IsObject, IsOptional } from 'class-validator';
import type { AssessmentAnswers } from '@annex21/shared';

export class UpdateAssessmentDto {
  @IsOptional()
  @IsObject()
  answers?: AssessmentAnswers;
}
