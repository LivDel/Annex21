import { ForbiddenException } from '@nestjs/common';
import type { DomainStore } from '../store/domain-store';

/** Org scoping for SSO admin routes — session.orgId match OR org_members row. */
export async function assertSsoOrgAccess(
  store: DomainStore,
  orgId: string,
  req: {
    session?: { orgId?: string | null } | null;
    user?: { id?: string; email?: string; role?: string } | null;
  },
  opts: { mutate: boolean },
): Promise<void> {
  const user = req.user;
  if (!user?.email) {
    throw new ForbiddenException('Authentification requise');
  }

  const member = await store.getMemberByEmail(orgId, user.email);
  const sameSessionOrg = Boolean(
    req.session?.orgId && req.session.orgId === orgId,
  );

  if (!sameSessionOrg && !member) {
    throw new ForbiddenException('Accès refusé à cette organisation');
  }

  if (!opts.mutate) return;

  const role = member?.role ?? (sameSessionOrg ? user.role : undefined);
  if (role !== 'owner' && role !== 'admin') {
    throw new ForbiddenException(
      'Seuls owner/admin peuvent configurer le SSO',
    );
  }
}
