'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ConnectorProvider, ConnectorState, ConnectorSummary } from '@annex21/shared';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const PROVIDER_LABEL: Record<ConnectorProvider, string> = {
  entra: 'Microsoft Entra ID',
  google_workspace: 'Google Workspace',
  aws: 'AWS (AssumeRole)',
};

const STATE_LABEL: Record<ConnectorState, string> = {
  disconnected: 'Déconnecté',
  connecting: 'Connexion…',
  connected: 'Connecté',
  syncing: 'Synchronisation…',
  error: 'Erreur',
};

const STATE_STYLE: Record<ConnectorState, string> = {
  disconnected: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  connecting: 'bg-amber-400/15 text-amber-200 border-amber-400/30',
  connected: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  syncing: 'bg-annex-blue/15 text-annex-blue border-annex-blue/30',
  error: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
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
    // Fallback UX offline — 3 cards disconnected
    setItems(
      (['entra', 'google_workspace', 'aws'] as ConnectorProvider[]).map((provider) => ({
        id: `conn_${orgId}_${provider}`,
        orgId,
        provider,
        state: 'disconnected' as const,
        scopeLabel:
          provider === 'entra'
            ? 'lecture journaux d’audit'
            : provider === 'google_workspace'
              ? 'utilisateurs + journaux d’audit (lecture seule)'
              : 'AssumeRole (ExternalId + ARN)',
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
          alert(`AWS ExternalId (à mettre dans la trust policy) : ${data.aws.externalId}`);
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
    return <p className="text-sm text-slate-400">Chargement des connecteurs…</p>;
  }

  const connectedCount = items.filter((c) => c.state !== 'disconnected').length;

  return (
    <div>
      {connectedCount === 0 && (
        <div className="mb-4 rounded-xl border border-annex-blue/30 bg-annex-deep/20 px-4 py-3 text-sm text-slate-200">
          Aucun connecteur actif — connectez Entra, Google Workspace ou AWS pour collecter des
          preuves (stockage MinIO EU, jamais exposées sur le Trust public).
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {items.map((c) => (
          <article key={c.id} className="card-glass flex flex-col rounded-2xl p-5">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-white">{PROVIDER_LABEL[c.provider]}</h3>
              <span
                className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATE_STYLE[c.state]}`}
              >
                {STATE_LABEL[c.state]}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-400">{c.scopeLabel}</p>
            {c.lastSyncAt && (
              <p className="mt-1 text-[11px] text-slate-500">
                Dernière sync : {new Date(c.lastSyncAt).toLocaleString('fr-FR')}
              </p>
            )}
            {c.error && (
              <div className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                <p>{c.error.message}</p>
                {c.error.retryable && (
                  <button
                    type="button"
                    className="mt-1 font-medium text-white underline"
                    disabled={busy !== null}
                    onClick={() => void sync(c.provider)}
                  >
                    Retry
                  </button>
                )}
              </div>
            )}
            {c.historicalEvidenceStale && (
              <p className="mt-2 text-[11px] text-amber-200/80">
                Evidence historique conservée (marquée obsolète).
              </p>
            )}
            <div className="mt-auto flex flex-wrap gap-2 pt-4">
              {c.state === 'disconnected' || c.state === 'error' ? (
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => void connect(c.provider)}
                  className="rounded-full bg-annex-deep px-3 py-1.5 text-xs font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  Connecter
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={busy !== null || c.state === 'syncing'}
                    onClick={() => void sync(c.provider)}
                    className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/15 disabled:opacity-50"
                  >
                    Sync
                  </button>
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => void revoke(c.provider)}
                    className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5 disabled:opacity-50"
                  >
                    Révoquer
                  </button>
                </>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
