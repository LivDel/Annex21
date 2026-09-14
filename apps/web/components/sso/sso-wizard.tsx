'use client';

import {
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import type { OrgIdentityProvider, SsoProtocol } from '@annex21/shared';
import {
  extractApiErrors,
  getSsoIdp,
  revokeSsoIdp,
  testSsoIdp,
  upsertSsoIdp,
} from '@/lib/app-api';

type WizardMode = SsoProtocol;
type UiPhase = 'idle' | 'connecting' | 'connected' | 'error';

const ORG = process.env.NEXT_PUBLIC_DEFAULT_ORG_ID ?? 'org_acme';

/**
 * Owner SSO wizard — Figma 02–06.
 * Active mode only (OIDC vs SAML): validation + fields for active mode.
 */
export function SsoWizard() {
  const [idp, setIdp] = useState<OrgIdentityProvider | null>(null);
  const [mode, setMode] = useState<WizardMode>('oidc');
  const [provider, setProvider] = useState<'entra' | 'google' | 'saml'>('entra');
  const [issuer, setIssuer] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [metadataUrl, setMetadataUrl] = useState('');
  const [phase, setPhase] = useState<UiPhase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const revokeTitleId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const revokeConfirmRef = useRef<HTMLButtonElement>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const row = await getSsoIdp(ORG);
      setIdp(row);
      if (row) {
        setMode(row.protocol);
        setProvider(row.provider === 'saml' ? 'saml' : row.provider);
        setIssuer(row.issuer ?? '');
        setClientId(row.clientId ?? '');
        setMetadataUrl(row.metadataUrl ?? '');
        if (row.status === 'connected') setPhase('connected');
        else if (row.status === 'error') {
          setPhase('error');
          setError(row.lastError ?? 'Échec du test de connexion');
        } else setPhase('idle');
      }
    } catch (err) {
      setError(extractApiErrors(err).join(' · ') || null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (revokeOpen) cancelRef.current?.focus();
  }, [revokeOpen]);

  function validateActiveMode(): boolean {
    const next: Record<string, string> = {};
    if (mode === 'oidc') {
      if (!issuer.trim()) next.issuer = 'Issuer requis (mode OIDC)';
      if (!clientId.trim()) next.clientId = 'Client ID requis (mode OIDC)';
      if (!clientSecret.trim() && !idp?.hasClientSecret) {
        next.clientSecret = 'Client secret requis (mode OIDC)';
      }
    } else {
      if (!metadataUrl.trim()) {
        next.metadataUrl = 'URL métadonnées requise (mode SAML)';
      }
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSaveAndTest(e?: FormEvent) {
    e?.preventDefault();
    setError(null);
    if (!validateActiveMode()) {
      setPhase('error');
      setError('Vérifiez les champs du mode actif.');
      return;
    }
    setPhase('connecting');
    try {
      const saved = await upsertSsoIdp(ORG, {
        protocol: mode,
        provider: mode === 'saml' ? 'saml' : provider,
        displayName:
          mode === 'saml'
            ? 'SAML'
            : provider === 'google'
              ? 'Google Workspace'
              : 'Entra ID',
        ...(mode === 'oidc'
          ? {
              issuer: issuer.trim(),
              clientId: clientId.trim(),
              ...(clientSecret.trim()
                ? { clientSecret: clientSecret.trim() }
                : {}),
            }
          : { metadataUrl: metadataUrl.trim() }),
      });
      setIdp(saved);
      const tested = await testSsoIdp(ORG);
      if (tested.ok) {
        setPhase('connected');
        setError(null);
        setClientSecret('');
        await refresh();
      } else {
        setPhase('error');
        setError(
          tested.message ||
            'Métadonnées inaccessibles ou client secret invalide. Vérifiez puis réessayez.',
        );
        await refresh();
      }
    } catch (err) {
      setPhase('error');
      setError(
        extractApiErrors(err).join(' · ') ||
          'Échec du test de connexion. Réessayez.',
      );
    }
  }

  async function onRevoke() {
    try {
      await revokeSsoIdp(ORG);
      setRevokeOpen(false);
      setIdp(null);
      setPhase('idle');
      setError(null);
      setClientSecret('');
    } catch (err) {
      setError(extractApiErrors(err).join(' · ') || 'Révocation impossible');
    }
  }

  const statusBadge =
    phase === 'connected'
      ? { label: 'Connecté', cls: 'border-emerald-400/50 bg-emerald-500/15 text-emerald-300' }
      : phase === 'connecting'
        ? { label: 'Connexion…', cls: 'border-amber-400/50 bg-amber-400/10 text-amber-200' }
        : phase === 'error'
          ? { label: 'Erreur', cls: 'border-red-500/60 bg-red-500/15 text-red-200' }
          : { label: 'Brouillon', cls: 'border-slate-500/50 bg-slate-500/10 text-slate-300' };

  const frame =
    phase === 'connecting'
      ? '03-wizard-connecting'
      : phase === 'connected'
        ? '04-wizard-connected'
        : phase === 'error'
          ? '05-wizard-erreur'
          : '02-wizard-idle';

  return (
    <div data-luix-frame={frame}>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-[#F8FAFC]">
          Paramètres · SSO
        </h1>
        <p className="mt-1 text-sm text-[#CBD5E1]">
          Wizard Owner · mode actif OIDC ou SAML → test connexion
        </p>
      </header>

      {idp?.status === 'connected' && (
        <div
          className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3"
          data-luix-frame="10-badge-idp-connected"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-emerald-200">
              IdP connecté · {idp.displayName}
            </p>
            <p className="text-xs text-[#CBD5E1]">
              MFA gérée par votre IdP · un seul IdP (V1)
            </p>
          </div>
        </div>
      )}

      <div className="card-glass rounded-2xl border border-white/10 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[#F8FAFC]">
              Configurer l&apos;IdP
            </h2>
            <p className="mt-1 text-xs text-[#CBD5E1]">
              Owner · OIDC / SAML · un seul IdP (V1)
            </p>
          </div>
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusBadge.cls}`}
          >
            {statusBadge.label}
          </span>
        </div>

        {/* Mode toggle — OIDC vs SAML */}
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={() => {
              setMode('oidc');
              setFieldErrors({});
              setError(null);
              if (provider === 'saml') setProvider('entra');
            }}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              mode === 'oidc'
                ? 'bg-annex-deep text-white ring-1 ring-annex-blue/50'
                : 'bg-white/5 text-[#CBD5E1] hover:bg-white/10'
            }`}
          >
            Client ID / secret (OIDC)
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('saml');
              setProvider('saml');
              setFieldErrors({});
              setError(null);
            }}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              mode === 'saml'
                ? 'bg-annex-deep text-white ring-1 ring-annex-blue/50'
                : 'bg-white/5 text-[#CBD5E1] hover:bg-white/10'
            }`}
          >
            URL métadonnées (SAML)
          </button>
        </div>

        {loading ? (
          <div className="mt-6 space-y-3">
            <div className="h-10 animate-pulse rounded-xl bg-white/5" />
            <div className="h-10 animate-pulse rounded-xl bg-white/5" />
          </div>
        ) : phase === 'connecting' ? (
          <div className="mt-6 space-y-3" aria-busy="true">
            <div className="h-10 animate-pulse rounded-xl bg-white/10" />
            <div className="h-10 animate-pulse rounded-xl bg-white/5" />
            <p className="text-sm text-[#CBD5E1]">Test de connexion en cours…</p>
            <button
              type="button"
              onClick={() => setPhase('idle')}
              className="text-sm text-[#CBD5E1] underline-offset-2 hover:underline"
            >
              Annuler
            </button>
          </div>
        ) : (
          <form onSubmit={onSaveAndTest} className="mt-6 space-y-4" noValidate>
            {/* ACTIVE MODE FIELDS ONLY */}
            {mode === 'oidc' ? (
              <>
                <div className="flex gap-2">
                  {(['entra', 'google'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setProvider(p)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                        provider === p
                          ? 'bg-white/15 text-white'
                          : 'text-[#CBD5E1] hover:bg-white/5'
                      }`}
                    >
                      {p === 'entra' ? 'Entra ID' : 'Google Workspace'}
                    </button>
                  ))}
                </div>
                <Field
                  label="Issuer / autorité OIDC"
                  value={issuer}
                  onChange={setIssuer}
                  placeholder="https://login.microsoftonline.com/{tenant}/v2.0"
                  error={fieldErrors.issuer}
                />
                <Field
                  label="Client ID"
                  value={clientId}
                  onChange={setClientId}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  error={fieldErrors.clientId}
                />
                <Field
                  label="Client secret"
                  value={clientSecret}
                  onChange={setClientSecret}
                  placeholder={
                    idp?.hasClientSecret
                      ? '········ (inchangé si vide)'
                      : '················'
                  }
                  type="password"
                  error={fieldErrors.clientSecret}
                />
              </>
            ) : (
              <Field
                label="URL métadonnées (SAML)"
                value={metadataUrl}
                onChange={setMetadataUrl}
                placeholder="https://login.microsoftonline.com/.../federationmetadata.xml"
                error={fieldErrors.metadataUrl}
              />
            )}

            {phase === 'error' && error && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3">
                <p className="text-sm font-semibold text-red-200">
                  Échec du test de connexion
                </p>
                <p className="mt-1 text-xs text-red-100/80">{error}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              {phase === 'connected' ? (
                <>
                  <button
                    type="submit"
                    className="rounded-full bg-annex-deep px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Re-tester
                  </button>
                  <button
                    type="button"
                    onClick={() => setRevokeOpen(true)}
                    className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-[#CBD5E1] hover:bg-white/5"
                  >
                    Révoquer
                  </button>
                </>
              ) : phase === 'error' ? (
                <button
                  type="submit"
                  className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-500"
                >
                  Réessayer
                </button>
              ) : (
                <button
                  type="submit"
                  className="rounded-full bg-annex-deep px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Tester la connexion
                </button>
              )}
            </div>
          </form>
        )}

        <p className="mt-6 text-[11px] text-[#CBD5E1]/70">
          MFA gérée par votre IdP · SCIM et multi-IdP hors V1
        </p>
      </div>

      {revokeOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={revokeTitleId}
          data-luix-frame="06-revoke-modal"
          onKeyDown={onRevokeDialogKeyDown}
        >
          <div className="card-glass w-full max-w-md rounded-2xl border border-white/10 p-6 shadow-xl">
            <h3
              id={revokeTitleId}
              className="text-lg font-semibold text-[#F8FAFC]"
            >
              Révoquer l&apos;IdP ?
            </h3>
            <p className="mt-2 text-sm text-[#CBD5E1]">
              Les utilisateurs devront se reconnecter via un autre moyen (lien
              magique). Cette action est immédiate.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                ref={cancelRef}
                type="button"
                onClick={() => setRevokeOpen(false)}
                className="rounded-full border border-white/20 px-4 py-2 text-sm text-[#CBD5E1] hover:bg-white/5"
              >
                Annuler
              </button>
              <button
                ref={revokeConfirmRef}
                type="button"
                onClick={() => void onRevoke()}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
              >
                Révoquer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  error?: string;
}) {
  return (
    <label className="block text-sm text-[#CBD5E1]">
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`mt-1.5 w-full rounded-xl border bg-white/5 px-3 py-2.5 text-[#F8FAFC] outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-annex-blue ${
          error ? 'border-red-400/60' : 'border-white/10'
        }`}
      />
      {error && (
        <span className="mt-1 block text-xs text-red-300">{error}</span>
      )}
    </label>
  );
}
