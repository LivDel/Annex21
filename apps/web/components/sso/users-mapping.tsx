'use client';

import { useCallback, useEffect, useState } from 'react';
import type { OrgMember, OrgMemberRole } from '@annex21/shared';
import {
  extractApiErrors,
  listSsoMembers,
  updateSsoMemberRole,
} from '@/lib/app-api';

const ORG = process.env.NEXT_PUBLIC_DEFAULT_ORG_ID ?? 'org_acme';

/** CDC roles only — IGNORE Figma « Contributor ». */
const ROLES: OrgMemberRole[] = ['owner', 'admin', 'member', 'viewer'];

const ROLE_LABEL: Record<OrgMemberRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  viewer: 'Viewer',
};

/**
 * Figma 09 — Admin users mapping.
 * Nouveaux SSO = member (limité) · zero JIT admin.
 */
export function UsersMapping() {
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listSsoMembers(ORG);
      setMembers(rows);
    } catch (err) {
      setError(
        extractApiErrors(err).join(' · ') ||
          'Impossible de charger les membres',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function assign(memberId: string, role: OrgMemberRole) {
    setBusy(memberId);
    try {
      const updated = await updateSsoMemberRole(ORG, memberId, role);
      setMembers((prev) =>
        prev.map((m) => (m.id === updated.id ? updated : m)),
      );
      setEditing(null);
    } catch (err) {
      setError(extractApiErrors(err).join(' · ') || 'Mise à jour impossible');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div data-luix-frame="09-admin-mapping" data-figma-node="41:2">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-[#F8FAFC]">
          Utilisateurs · mapping SSO
        </h1>
        <p className="mt-1 text-sm text-[#CBD5E1]">
          Users → org + rôles explicites · pas de JIT admin · nouveaux = member
          (limité) jusqu&apos;à assignation
        </p>
      </header>

      <div className="mb-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[#CBD5E1]">
        <strong className="font-medium text-[#F8FAFC]">
          MFA gérée par votre IdP.
        </strong>{' '}
        Annex21 ne propose pas de MFA locale en V1 — appliquez les politiques
        côté Entra / Google Workspace.
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-300">{error}</p>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl bg-white/5"
            />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="card-glass rounded-2xl border border-white/10 p-8 text-center">
          <p className="text-sm text-[#CBD5E1]">
            Aucun membre SSO pour l&apos;instant. Les premiers utilisateurs
            arriveront avec le rôle <strong className="text-white">member</strong>.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {members.map((m) => {
            const initials = (m.displayName || m.email)
              .split(/[\s@]/)
              .filter(Boolean)
              .slice(0, 2)
              .map((s) => s[0]?.toUpperCase() ?? '')
              .join('');
            const limited = m.pendingAssignment && m.role === 'member';
            return (
              <li
                key={m.id}
                className="card-glass flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 px-4 py-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-annex-deep text-xs font-semibold text-white">
                  {initials || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-[#F8FAFC]">
                    {m.displayName || m.email.split('@')[0]}
                  </p>
                  <p className="truncate text-xs text-[#CBD5E1]">{m.email}</p>
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    limited
                      ? 'border-amber-400/50 bg-amber-400/10 text-amber-200'
                      : m.role === 'owner'
                        ? 'border-annex-blue/50 bg-annex-deep/40 text-white'
                        : 'border-white/15 bg-white/5 text-[#CBD5E1]'
                  }`}
                >
                  {limited ? 'Limité (nouveau)' : ROLE_LABEL[m.role]}
                </span>

                {editing === m.id ? (
                  <div className="flex flex-wrap gap-2">
                    {ROLES.map((r) => (
                      <button
                        key={r}
                        type="button"
                        disabled={busy === m.id}
                        onClick={() => void assign(m.id, r)}
                        className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-[#F8FAFC] hover:bg-white/10 disabled:opacity-50"
                      >
                        {ROLE_LABEL[r]}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setEditing(null)}
                      className="text-xs text-[#CBD5E1] underline-offset-2 hover:underline"
                    >
                      Annuler
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditing(m.id)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${
                      limited
                        ? 'bg-annex-deep text-white hover:bg-blue-700'
                        : 'border border-white/20 text-[#CBD5E1] hover:bg-white/5'
                    }`}
                  >
                    {limited ? 'Assigner' : 'Modifier'}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-6 text-[11px] text-[#CBD5E1]/70">
        Hors V1 : SCIM · multi-IdP / multi-org · login social public
      </p>
    </div>
  );
}
