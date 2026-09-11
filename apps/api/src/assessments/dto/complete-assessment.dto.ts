import { Equals } from 'class-validator';

export class CompleteAssessmentDto {
  /** Obligatoire à true pour clôturer (US-AS03). */
  @Equals(true, { message: 'disclaimer_ack doit être true' })
  disclaimer_ack!: true;
}
