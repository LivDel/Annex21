'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  evaluateTrustPublishChecklist,
  type TrustCenterView,
  type TrustLocale,
} from '@annex21/shared';
import {
  DEFAULT_TRUST_SLUG,
  extractApiErrors,
  getTrustDraft,
  patchTrustDraft,
  publishTrust,
  unpublishTrust,
} from '@/lib/app-api';
import { ControlStatus } from '@/components/control-status';
import {
  TrustPublicOfflinePill,
  TrustStatusBadge,
} from '@/components/trust-status-badge';

type Toast = { kind: 'ok' | 'err'; text: string } | null;

/**
 * Trust editor V1 — Figma 21:3 / 21:13.
 * Zéro upload evidence. Publish gated checklist. Softs void + muted #CBD5E1.
 */
export function TrustEditorPanel({ orgSlug = DEFAULT_TRUST_SLUG }: { orgSlug?: string }) {
  const [trust, setTrust] = useState<TrustCenterView | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const [orgName, setOrgName] = useState('');
  const [country, setCountry] = useState('');
  const [locale, setLocale] = useState<TrustLocale>('fr');
  const [disclaimerAck, setDisclaimerAck] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const row = await getTrustDraft(orgSlug);
      setTrust(row);
      setOrgName(row.org.name);
      setCountry(row.org.country === 'FR' ? 'France' : row.org.country);
      setLocale(row.locale);
      setDisclaimerAck(row.disclaimerAck);
      setErr(null);
    } catch (e) {
      setErr(extractApiErrors(e).join(' '));
    } finally {
      setLoading(false);
    }
  }, [orgSlug]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(t);
  }, [toast]);

  const checklist = useMemo(() => {
    if (!trust) {
      return evaluateTrustPublishChecklist({
        org: { slug: orgSlug, name: orgName, country },
        controls: [],
        disclaimerAck,
      });
    }
    return evaluateTrustPublishChecklist({
      org: { ...trust.org, name: orgName },
      controls: trust.controls,
      disclaimerAck,
    });
  }, [trust, orgName, country, disclaimerAck, orgSlug]);

  const isPublished = trust?.status === 'published';

  async function saveDraftFields() {
    setBusy(true);
    try {
      const saved = await patchTrustDraft(orgSlug, {
        orgName: orgName.trim(),
        country: country.trim() || 'FR',
        locale,
        disclaimerAck,
      });
      setTrust(saved);
      setToast({ kind: 'ok', text: 'Brouillon enregistré' });
    } catch (e) {
      setToast({ kind: 'err', text: extractApiErrors(e).join(' ') });
    } finally {
      setBusy(false);
    }
  }

  async function confirmPublish() {
    setBusy(true);
    try {
      await patchTrustDraft(orgSlug, {
        orgName: orgName.trim(),
        country: country.trim() || 'FR',
        locale,
        disclaimerAck: true,
      });
      const saved = await publishTrust(orgSlug);
      setTrust(saved);
      setDisclaimerAck(true);
      setModalOpen(false);
      setToast({ kind: 'ok', text: 'Trust publié' });
    } catch (e) {
      setToast({ kind: 'err', text: extractApiErrors(e).join(' ') });
    } finally {
      setBusy(false);
    }
  }

  async function onUnpublish() {
    setBusy(true);
    try {
      const saved = await unpublishTrust(orgSlug);
      setTrust(saved);
      setToast({ kind: 'ok', text: 'Trust repassé en brouillon' });
    } catch (e) {
      setToast({ kind: 'err', text: extractApiErrors(e).join(' ') });
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-[#CBD5E1]" data-luix-frame="trust-editor-loading">
        Chargement Trust editor…
      </p>
    );
  }

  if (!trust) {
    return (
      <div className="card-glass rounded-2xl p-6" role="alert">
        <p className="text-sm text-rose-300">{err ?? 'Trust introuvable'}</p>
        <p className="mt-2 text-xs text-[#CBD5E1]">
          Démarrer l&apos;API (auth stub) ou vérifier le slug <code>{orgSlug}</code>.
        </p>
      </div>
    );
  }

  return (
    <div
      data-luix-frame="01-trust-editor-brouillon"
      data-figma-node="21:3"
      data-figma-page="21:2"
    >
      {/* Banner status */}
      {isPublished ? (
        <div
          role="status"
          className="mb-6 rounded-xl border border-annex-mint/60 bg-annex-mint px-4 py-3 text-center text-sm font-bold tracking-wide text-navy shadow-[0_0_40px_rgba(16,185,129,0.25)]"
        >
          Publié — visible sur /trust/{trust.org.slug}
        </div>
      ) : (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-amber-400/50 bg-amber-500 px-4 py-3 text-center text-sm font-bold uppercase tracking-wide text-navy shadow-[0_0_40px_rgba(245,158,11,0.35)]"
        >
          Brouillon — non publié · draft ≠ public
        </div>
      )}

      {toast && (
        <div
          role="status"
          className={`fixed right-6 top-6 z-50 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm shadow-lg ${
            toast.kind === 'ok'
              ? 'border-annex-mint/60 bg-navy text-white'
              : 'border-rose-400/40 bg-navy text-rose-200'
          }`}
          data-luix-frame="03-modal-publish-toast"
          data-figma-node="21:13"
        >
          <span
            className={`h-2 w-2 rounded-full ${
              toast.kind === 'ok' ? 'bg-annex-mint' : 'bg-rose-400'
            }`}
          />
          {toast.text}
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Trust editor</h1>
          <p className="text-sm text-[#CBD5E1]">
            Ce contenu n&apos;est{' '}
            <span className="font-semibold text-amber-200">pas</span> visible sur
            /trust/:org tant qu&apos;il n&apos;est pas publié.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TrustStatusBadge status={trust.status} />
          {!isPublished && <TrustPublicOfflinePill />}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main editor */}
        <div className="space-y-4">
          <section className="card-glass rounded-2xl p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#CBD5E1]">
              Profil
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm text-[#CBD5E1]">
                Organisation
                <input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-annex-blue/50"
                  autoComplete="organization"
                />
              </label>
              <label className="block text-sm text-[#CBD5E1]">
                Pays
                <input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-annex-blue/50"
                />
              </label>
            </div>
          </section>

          <section className="card-glass rounded-2xl p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#CBD5E1]">
              Contrôles attestés
            </p>
            <p className="mt-2 text-xs text-[#CBD5E1]">
              Résumés NIS2 uniquement — aucune preuve brute, aucun upload.
            </p>
            <ul className="mt-4 divide-y divide-white/5">
              {trust.controls.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-3">
                  <span className="text-sm text-slate-200">{c.domain}</span>
                  <ControlStatus status={c.status} />
                </li>
              ))}
              {trust.controls.length === 0 && (
                <li className="py-3 text-sm text-[#CBD5E1]">Aucun contrôle pour l’instant.</li>
              )}
            </ul>
          </section>

          <section className="card-glass rounded-2xl p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#CBD5E1]">
              Langue du Trust
            </p>
            <div className="mt-3 flex overflow-hidden rounded-lg border border-white/10 text-xs font-medium">
              {(['fr', 'en'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLocale(l)}
                  className={`px-4 py-2 uppercase ${
                    locale === l
                      ? 'bg-annex-deep text-white'
                      : 'text-[#CBD5E1] hover:bg-white/5'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
            <label className="mt-4 flex items-start gap-3 text-sm text-[#CBD5E1]">
              <input
                type="checkbox"
                checked={disclaimerAck}
                onChange={(e) => setDisclaimerAck(e.target.checked)}
                className="mt-1"
              />
              <span>
                Disclaimer accepté — je confirme que ce Trust ne contient aucune
                preuve brute et que la publication est volontaire (RG-07/08).
              </span>
            </label>
            <p className="mt-4 text-[11px] text-[#CBD5E1]">
              Pas d&apos;upload Evidence ici — les preuves restent sur /app/evidence.
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={() => void saveDraftFields()}
              className="mt-4 rounded-full border border-white/15 px-4 py-2 text-xs text-[#CBD5E1] hover:bg-white/5 disabled:opacity-50"
            >
              Enregistrer le brouillon
            </button>
          </section>
        </div>

        {/* Checklist + actions */}
        <aside className="space-y-4">
          <section className="card-glass rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#CBD5E1]">
              Checklist publication V1
            </p>
            <p className="mt-1 text-[11px] text-amber-200/90">
              Publish jamais auto — confirmation requise.
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <CheckItem ok={checklist.orgNamed} label="Organisation nommée" />
              <CheckItem ok={checklist.hasAttestedControl} label="≥ 1 contrôle attesté" />
              <CheckItem ok={checklist.disclaimerAck} label="Disclaimer accepté" />
            </ul>
            {!checklist.ready && (
              <ul className="mt-3 space-y-1 text-[11px] text-rose-300" role="alert">
                {checklist.errorsFr.map((m) => (
                  <li key={m}>• {m}</li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-[11px] text-[#CBD5E1]">
              Hors V1 : questionnaires acheteurs
            </p>
          </section>

          <section className="card-glass rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#CBD5E1]">
              Actions
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {!isPublished ? (
                <button
                  type="button"
                  disabled={busy || !checklist.ready}
                  onClick={() => setModalOpen(true)}
                  className="rounded-full bg-annex-deep px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Publier (confirmation)
                </button>
              ) : (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void onUnpublish()}
                  className="rounded-full border border-amber-400/40 px-4 py-2.5 text-sm font-semibold text-amber-200 hover:bg-amber-400/10 disabled:opacity-50"
                >
                  Dépublier → brouillon
                </button>
              )}
              <Link
                href={`/app/trust-editor/preview/${trust.org.slug}`}
                className="rounded-full border border-amber-400/40 px-4 py-2 text-center text-sm font-medium text-amber-200"
              >
                Prévisualiser brouillon (auth)
              </Link>
              <Link
                href={`/trust/${trust.org.slug}`}
                className="rounded-full border border-white/15 px-4 py-2 text-center text-sm text-[#CBD5E1] hover:bg-white/5"
              >
                {isPublished
                  ? `Voir public /trust/${trust.org.slug}`
                  : `Voir public /trust/${trust.org.slug} → 404 (draft)`}
              </Link>
            </div>
            <p className="mt-3 text-[11px] text-[#CBD5E1]">
              draft ≠ public · zéro preuve brute
            </p>
          </section>
        </aside>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="publish-modal-title"
          data-luix-frame="03-modal-publish-toast"
          data-figma-node="21:13"
        >
          <div className="card-glass w-full max-w-md rounded-2xl border border-white/15 p-6 shadow-[0_0_60px_rgba(29,78,216,0.25)]">
            <h2 id="publish-modal-title" className="text-lg font-semibold text-white">
              Confirmer la publication
            </h2>
            <p className="mt-2 text-sm text-[#CBD5E1]">
              Publish n&apos;est jamais automatique. Vérifiez la checklist V1 puis confirmez.
            </p>
            <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
              <ul className="space-y-2 text-sm">
                <CheckItem
                  ok={checklist.orgNamed}
                  label={`Organisation nommée (${orgName.trim() || '—'})`}
                />
                <CheckItem ok={checklist.hasAttestedControl} label="≥ 1 contrôle attesté" />
                <CheckItem ok={checklist.disclaimerAck} label="Disclaimer accepté" />
              </ul>
              <p className="mt-2 text-[11px] text-[#CBD5E1]">
                Hors V1 — pas de questionnaires acheteurs
              </p>
            </div>
            <p className="mt-3 text-xs text-[#CBD5E1]">
              Après confirmation : le brouillon devient public sur /trust/{trust.org.slug}.
              Zéro preuve brute.
            </p>
            {!checklist.ready && (
              <ul className="mt-2 space-y-1 text-[11px] text-rose-300">
                {checklist.errorsFr.map((m) => (
                  <li key={m}>• {m}</li>
                ))}
              </ul>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-full border border-white/20 px-4 py-2 text-sm text-white"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={busy || !checklist.ready}
                onClick={() => void confirmPublish()}
                className="rounded-full bg-annex-deep px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
              >
                Confirmer la publication
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CheckItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span
        className={`flex h-4 w-4 items-center justify-center rounded border text-[10px] ${
          ok
            ? 'border-annex-mint/60 bg-annex-mint/20 text-annex-mint'
            : 'border-white/20 text-transparent'
        }`}
        aria-hidden
      >
        ✓
      </span>
      <span className={ok ? 'text-slate-200' : 'text-[#CBD5E1]'}>{label}</span>
    </li>
  );
}
