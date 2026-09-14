import { IsIn } from 'class-validator';
import type { OrgMemberRole } from '@annex21/shared';

export class UpdateMemberRoleDto {
  @IsIn(['owner', 'admin', 'member', 'viewer'])
  role!: OrgMemberRole;
}
