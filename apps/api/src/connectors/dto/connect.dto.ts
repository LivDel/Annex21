import { IsOptional, IsString, Matches } from 'class-validator';

export class ConnectConnectorDto {
  /** AWS AssumeRole ARN */
  @IsOptional()
  @IsString()
  @Matches(/^arn:aws:iam::\d{12}:role\/[\w+=,.@\-_/]+$/, {
    message: 'roleArn AWS invalide',
  })
  roleArn?: string;

  /**
   * OAuth redirect / callback URL from client — MUST be allowlisted
   * (same AUTH_REDIRECT_ALLOWLIST as auth verify). Arbitrary URLs rejected.
   */
  @IsOptional()
  @IsString()
  redirectUri?: string;

  /** Alias of redirectUri (open-redirect hardening applies equally). */
  @IsOptional()
  @IsString()
  redirect?: string;

  @IsOptional()
  @IsString()
  orgId?: string;
}
