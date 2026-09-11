import { IsOptional, IsString, MinLength } from 'class-validator';

export class OpenIncidentDto {
  @IsString()
  orgId!: string;

  @IsString()
  playbookTemplateId!: string;

  @IsString()
  @MinLength(3)
  title!: string;

  @IsOptional()
  @IsString()
  createdBy?: string;
}
