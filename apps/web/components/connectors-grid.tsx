'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ConnectorProvider, ConnectorState, ConnectorSummary } from '@annex21/shared';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const PROVIDER_META: Record<
  ConnectorProvider,
  { title: string; badge: string; subtitle: string; blurb: string }
> = {
  entra: {
    title: 'M365 / Entra ID',
    badge: 'M365',
    subtitle: 'lecture journaux d’audit · AuditLog.Read.All',
    blurb:
      'Connectez Entra pour collecter des preuves depuis les journaux d’audit (pas d’accès annuaire).',
  },
  google_workspace: {
    title: 'Google Workspace',
    badge: 'GW',
    subtitle: 'Admin reports · lecture seule',
    blurb: 'Utilisateurs et journaux d’audit en lecture seule.',
  },
  aws: {
    title: 'AWS',
    badge: 'AWS',
    subtitle: 'CloudTrail · lecture seule',
    blurb: 'AssumeRole (ExternalId + ARN) — pas d’OAuth utilisateur.',
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

export function ConnectorsGrid({ orgId = 'org_acme' }: { orgId?: string }) {
  const [items, setItems] = useState<ConnectorSummary[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

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
          // eslint-disable-next-line no-alert
          alert(`AWS ExternalId (trust policy) : ${data.aws.externalId}`);
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
      await load();
    } finally {
      setBusy(null);
    }
  }

  if (!items) {
    return <p className="text-sm text-[#CBD5E1]">Chargement des connecteurs…</p>;
  }

  const connectedCount = items.filter((c) => c.state !== 'disconnected').length;

  return (
    <div>
      {connectedCount === 0 && (
        <div
          role="status"
          className="mb-4 rounded-xl border border-annex-blue/40 bg-annex-deep/25 px-4 py-3 text-sm text-[#F8FAFC]"
        >
          Aucun connecteur actif — branchez Entra, Google Workspace ou AWS pour collecter des
          preuves (MinIO EU, jamais sur le Trust public).
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {items.map((c) => {
          const meta = PROVIDER_META[c.provider];
          const isConnecting = c.state === 'connecting' || c.state === 'syncing';
          const isError = c.state === 'error';
          const isConnected = c.state === 'connected';
          const isStale = Boolean(c.historicalEvidenceStale) && c.state === 'disconnected';

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

              <div className="mt-auto flex flex-wrap gap-2 pt-4">
                {isConnecting ? (
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => void revoke(c.provider)}
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
                      onClick={() => void revoke(c.provider)}
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
    </div>
  );
}
