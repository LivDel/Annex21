import { IsOptional, IsString, Matches } from 'class-validator';

export class ConnectConnectorDto {
  /** AWS AssumeRole ARN */
  @IsOptional()
  @IsString()
  @Matches(/^arn:aws:iam::\d{12}:role\/[\w+=,.@\-_/]+$/, {
    message: 'roleArn AWS invalide',
  })
  roleArn?: string;

  @IsOptional()
  @IsString()
  redirectUri?: string;

  @IsOptional()
  @IsString()
  orgId?: string;
}
