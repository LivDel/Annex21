'use client';

import Link from 'next/link';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { ConnectorProvider, ConnectorSummary } from '@annex21/shared';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const PROVIDER_META: Record<
  ConnectorProvider,
  { title: string; badge: string; subtitle: string; blurb: string; scopeRevoke: string }
> = {
  entra: {
    title: 'M365 / Entra ID',
    badge: 'M365',
    subtitle: 'lecture journaux d’audit · AuditLog.Read.All',
    blurb:
      'Connectez Entra pour collecter des preuves depuis les journaux d’audit (pas d’accès annuaire).',
    scopeRevoke: 'AuditLog.Read.All uniquement (pas d’accès annuaire)',
  },
  google_workspace: {
    title: 'Google Workspace',
    badge: 'GW',
    subtitle: 'Admin reports · lecture seule',
    blurb: 'Utilisateurs et journaux d’audit en lecture seule.',
    scopeRevoke: 'Admin reports (lecture seule)',
  },
  aws: {
    title: 'AWS',
    badge: 'AWS',
    subtitle: 'CloudTrail · lecture seule',
    blurb: 'AssumeRole (ExternalId + ARN) — pas d’OAuth utilisateur.',
    scopeRevoke: 'AssumeRole ExternalId + ARN',
  },
};

const AUTH_STUB = process.env.NEXT_PUBLIC_AUTH_STUB_TOKEN ?? 'annex21-dev-stub';

async function apiFetch(path: string, init?: RequestInit) {
  return fetch(`${API}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AUTH_STUB}`,
      ...(init?.headers ?? {}),
    },
  });
}

function focusableWithin(root: HTMLElement): HTMLElement[] {
  const nodes = root.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
  );
  return Array.from(nodes).filter((el) => !el.hasAttribute('disabled') && el.tabIndex !== -1);
}

export function ConnectorsGrid({ orgId = 'org_acme' }: { orgId?: string }) {
  const [items, setItems] = useState<ConnectorSummary[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [disconnectTarget, setDisconnectTarget] = useState<ConnectorProvider | null>(null);
  const [awsExternalId, setAwsExternalId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descId = useId();

  const load = useCallback(async () => {
    try {
      const res = await apiFetch(`/connectors?orgId=${encodeURIComponent(orgId)}`);
      if (res.ok) {
        setItems((await res.json()) as ConnectorSummary[]);
        return;
      }
    } catch {
      /* API absente */
    }
    setItems(
      (['entra', 'google_workspace', 'aws'] as ConnectorProvider[]).map((provider) => ({
        id: `conn_${orgId}_${provider}`,
        orgId,
        provider,
        state: 'disconnected' as const,
        scopeLabel: PROVIDER_META[provider].subtitle,
        updatedAt: new Date().toISOString(),
      })),
    );
  }, [orgId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Focus trap for disconnect modal (réf. Maquettiste 06-modal-disconnect)
  useEffect(() => {
    if (!disconnectTarget) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const t = window.setTimeout(() => cancelBtnRef.current?.focus(), 0);

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setDisconnectTarget(null);
        return;
      }
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const list = focusableWithin(dialogRef.current);
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener('keydown', onKeyDown);
      restoreFocusRef.current?.focus?.();
    };
  }, [disconnectTarget]);

  async function connect(provider: ConnectorProvider) {
    setBusy(provider);
    try {
      const body =
        provider === 'aws'
          ? { orgId, roleArn: 'arn:aws:iam::123456789012:role/Annex21AuditRead' }
          : { orgId };
      const res = await apiFetch(`/connectors/${provider}/connect`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          authorizationUrl?: string;
          aws?: { externalId: string };
        };
        if (data.authorizationUrl) {
          window.location.href = data.authorizationUrl;
          return;
        }
        if (data.aws?.externalId) {
          // In-card UI — jamais alert()
          setAwsExternalId(data.aws.externalId);
          setCopied(false);
        }
        await load();
      }
    } finally {
      setBusy(null);
    }
  }

  async function sync(provider: ConnectorProvider) {
    setBusy(`sync-${provider}`);
    try {
      await apiFetch(`/connectors/${provider}/sync?orgId=${encodeURIComponent(orgId)}`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function revoke(provider: ConnectorProvider) {
    setBusy(`rev-${provider}`);
    try {
      await apiFetch(`/connectors/${provider}/revoke?orgId=${encodeURIComponent(orgId)}`, {
        method: 'POST',
      });
      if (provider === 'aws') setAwsExternalId(null);
      await load();
    } finally {
      setBusy(null);
      setDisconnectTarget(null);
    }
  }

  async function copyExternalId() {
    if (!awsExternalId) return;
    try {
      await navigator.clipboard.writeText(awsExternalId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  if (!items) {
    return <p className="text-sm text-[#CBD5E1]">Chargement des connecteurs…</p>;
  }

  const connectedCount = items.filter((c) => c.state !== 'disconnected').length;
  const showZeroBanner = connectedCount === 0 && !bannerDismissed;
  const disconnectMeta = disconnectTarget ? PROVIDER_META[disconnectTarget] : null;

  return (
    <div>
      {showZeroBanner && (
        <div
          role="status"
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/40 bg-amber-500/15 px-4 py-3 text-sm text-[#F8FAFC]"
        >
          <p>
            <span className="font-semibold">Aucun connecteur actif</span>
            <span className="text-[#CBD5E1]">
              {' '}
              — Sans connecteur, la collecte de preuves reste manuelle. Vous pouvez passer cette
              étape.
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/app/assessment"
              className="rounded-full bg-[#0B1220] px-3 py-1.5 text-xs font-semibold text-white hover:bg-black"
            >
              Passer pour l’instant
            </Link>
            <button
              type="button"
              onClick={() => setBannerDismissed(true)}
              className="rounded-full border border-white/20 px-3 py-1.5 text-xs text-[#CBD5E1] hover:bg-white/5"
            >
              Masquer
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {items.map((c) => {
          const meta = PROVIDER_META[c.provider];
          const isConnecting = c.state === 'connecting' || c.state === 'syncing';
          const isError = c.state === 'error';
          const isConnected = c.state === 'connected';
          const isStale = Boolean(c.historicalEvidenceStale) && c.state === 'disconnected';
          const showAwsId = c.provider === 'aws' && awsExternalId && isConnected;

          return (
            <article key={c.id} className="card-glass flex flex-col rounded-2xl p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-annex-deep text-[10px] font-bold text-white">
                    {meta.badge}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#F8FAFC]">{meta.title}</h3>
                    <p className="mt-0.5 text-xs text-[#CBD5E1]">{meta.subtitle}</p>
                  </div>
                </div>
                {isConnected && (
                  <span className="rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                    Connecté
                  </span>
                )}
                {(isConnecting || isStale) && (
                  <span className="h-3 w-3 shrink-0 rounded-full border-2 border-amber-300 border-t-transparent" />
                )}
              </div>

              {isConnecting ? (
                <div className="mt-4 space-y-2" aria-hidden>
                  <div className="h-2 w-full rounded bg-white/10" />
                  <div className="h-2 w-4/5 rounded bg-white/10" />
                  <div className="h-2 w-3/5 rounded bg-white/10" />
                </div>
              ) : isError ? (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-semibold" style={{ color: '#FCA5A5' }}>
                    Aucune donnée exportée
                  </p>
                  <p className="text-xs leading-relaxed text-[#CBD5E1]">
                    {c.error?.message ??
                      'Le consentement OAuth n’a renvoyé aucun événement. Vérifiez le tenant et réessayez.'}
                  </p>
                </div>
              ) : isConnected ? (
                <div className="mt-3 space-y-1 text-xs text-[#CBD5E1]">
                  {c.lastSyncAt && (
                    <p>Dernière sync · {new Date(c.lastSyncAt).toLocaleString('fr-FR')}</p>
                  )}
                  <p className="font-medium text-emerald-300">Preuves synchronisées · hash OK</p>
                </div>
              ) : isStale ? (
                <p className="mt-3 text-xs leading-relaxed text-[#CBD5E1]">
                  Les preuves existantes deviennent obsolètes (non supprimées). Reconnectez pour
                  rafraîchir.
                </p>
              ) : (
                <p className="mt-3 text-xs leading-relaxed text-[#CBD5E1]">{meta.blurb}</p>
              )}

              {showAwsId && (
                <div className="mt-3 rounded-xl border border-annex-blue/30 bg-annex-deep/20 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-annex-blue">
                    ExternalId (trust policy)
                  </p>
                  <code className="mt-1 block break-all font-mono text-xs text-[#F8FAFC]">
                    {awsExternalId}
                  </code>
                  <button
                    type="button"
                    onClick={() => void copyExternalId()}
                    className="mt-2 rounded-full border border-white/20 px-3 py-1 text-[11px] font-semibold text-[#F8FAFC] hover:bg-white/5"
                  >
                    {copied ? 'Copié' : 'Copier ExternalId'}
                  </button>
                </div>
              )}

              <div className="mt-auto flex flex-wrap gap-2 pt-4">
                {isConnecting ? (
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => setDisconnectTarget(c.provider)}
                    className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-[#F8FAFC] hover:bg-white/5 disabled:opacity-50"
                  >
                    Annuler
                  </button>
                ) : isError ? (
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => void sync(c.provider)}
                    className="rounded-full bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
                  >
                    Réessayer
                  </button>
                ) : isConnected ? (
                  <>
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => void sync(c.provider)}
                      className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-[#F8FAFC] hover:bg-white/5 disabled:opacity-50"
                    >
                      Synchroniser
                    </button>
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => setDisconnectTarget(c.provider)}
                      className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-[#CBD5E1] hover:bg-white/5 disabled:opacity-50"
                    >
                      Déconnecter
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => void connect(c.provider)}
                    className="rounded-full bg-annex-deep px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isStale ? 'Reconnecter' : 'Connecter'}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {disconnectTarget && disconnectMeta && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDisconnectTarget(null);
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            className="card-glass w-full max-w-md rounded-2xl p-6 shadow-aurora"
          >
            <h2 id={titleId} className="text-lg font-semibold text-[#F8FAFC]">
              Déconnecter {disconnectMeta.title} ?
            </h2>
            <p id={descId} className="mt-2 text-sm leading-relaxed text-[#CBD5E1]">
              Les preuves déjà collectées deviennent obsolètes (stale) — elles ne sont pas
              supprimées. Scope révoqué : {disconnectMeta.scopeRevoke}.
            </p>
            <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/20 px-3 py-2.5 text-sm text-amber-100">
              <p className="font-semibold text-amber-50">Impact</p>
              <p className="mt-0.5 text-xs leading-relaxed text-amber-50/90">
                Preuves marquées stale · sync stoppée · Trust inchangé (jamais de preuves brutes).
              </p>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                ref={cancelBtnRef}
                type="button"
                onClick={() => setDisconnectTarget(null)}
                className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-[#F8FAFC] hover:bg-white/5"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => void revoke(disconnectTarget)}
                className="rounded-full bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-50"
              >
                Déconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
