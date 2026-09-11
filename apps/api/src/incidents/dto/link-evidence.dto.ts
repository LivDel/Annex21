import { IsString } from 'class-validator';

export class LinkEvidenceDto {
  @IsString()
  evidenceId!: string;
}
