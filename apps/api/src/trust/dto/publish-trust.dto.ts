import { IsOptional, IsString } from 'class-validator';

export class PublishTrustDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
