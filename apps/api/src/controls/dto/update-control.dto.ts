import { IsIn, IsOptional, IsString } from 'class-validator';
import type { ControlStatus } from '@annex21/shared';

export class UpdateControlDto {
  @IsOptional()
  @IsIn(['not_started', 'in_progress', 'implemented', 'not_applicable'])
  status?: ControlStatus;

  @IsOptional()
  @IsString()
  owner?: string;

  @IsOptional()
  @IsString()
  dueAt?: string;
}
