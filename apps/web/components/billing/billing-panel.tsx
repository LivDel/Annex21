'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AcvTier, BillingStatusResponse } from '@annex21/shared';
import {
  createBillingCheckout,
  extractApiErrors,
  getBillingStatus,
} from '@/lib/app-api';
import { BillingStatusBadge } from './billing-status-badge';

const SALES_MAIL = 'mailto:sales@annex21.eu';
const SUPPORT_MAIL = 'mailto:support@annex21.eu';

/** Stub invoices when API has none yet — clearly labeled. */
const STUB_INVOICES = [
  { id: 'INV-2026-001', dateLabel: '11 sept. 2026', amount: '18 000 €' },
  { id: 'INV-2025-001', dateLabel: '11 sept. 2025', amount: '18 000 €' },
  { id: 'INV-2024-001', dateLabel: '11 sept. 2024', amount: '18 000 €' },
];

/**
 * /app/billing — Figma Stripe ACV V1 overlay.
 * void soft, muted #CBD5E1, accent #1d4ed8, glass cards. No orbs / washes.
 * Sales-led · no price picker · no Stripe secrets client-side.
 */
export function BillingPanel() {
  const [data, setData] = useState<BillingStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [includeFee, setIncludeFee] = useState(false);
  /** Devis ACV signé — bande 10/20/30 (sales-led, pas freemium). */
  const [acvTier, setAcvTier] = useState<AcvTier>('20k');
  /** Local step: empty → devis before Stripe redirect. */
  const [showDevis, setShowDevis] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const status = await getBillingStatus();
      setData(status);
    } catch (err) {
      setError(
        extractApiErrors(err).join(' · ') ||
          'Impossible de charger le statut',
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function startCheckout(opts?: {
    retry?: boolean;
    withFee?: boolean;
    tier?: AcvTier;
  }) {
    setBusy(true);
    setError(null);
    try {
      const session = await createBillingCheckout({
        acvTier: opts?.tier ?? acvTier,
        includeOnboardingFee: opts?.retry
          ? false
          : (opts?.withFee ?? includeFee),
      });
      if (session.url) {
        window.location.href = session.url;
        return;
      }
      setError('Session Checkout sans URL');
    } catch (err) {
      setError(
        extractApiErrors(err).join(' · ') || 'Checkout indisponible',
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="card-glass rounded-2xl border border-white/10 px-6 py-10">
        <p className="text-sm text-[#CBD5E1]">
          Chargement du statut facturation…
        </p>
      </div>
    );
  }

  const hasSub = Boolean(data?.hasSubscription);
  const status = data?.status ?? 'pending';
  const isPastDue = status === 'past_due';
  const isActive = status === 'active';
  const isCanceled = status === 'canceled';
  const isPending = hasSub && status === 'pending';
  const isDevis =
    showDevis &&
    !isPastDue &&
    !isActive &&
    !isPending &&
    (!hasSub || isCanceled);
  // canceled → empty soft (Figma 28:2): reuse empty CTA, no harsh canceled card
  const isEmpty =
    (!hasSub || isCanceled) &&
    !showDevis &&
    !isPastDue &&
    !isActive &&
    !isPending;

  return (
    <div className="relative space-y-6" data-luix-frame="billing-panel">
      {error ? (
        <div className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          {error}
        </div>
      ) : null}

      {isEmpty ? (
        <>
          <header>
            <h1 className="text-2xl font-semibold text-white">Facturation</h1>
            <p className="mt-1 text-sm text-[#CBD5E1]">
              Abonnement ACV annuel · sales-led · pas de freemium
            </p>
          </header>

          <div
            className="card-glass mx-auto max-w-lg rounded-2xl border border-white/10 px-8 py-10 text-center"
            data-luix-frame="billing-empty"
            data-billing-soft={isCanceled ? 'canceled-empty' : 'empty'}
          >
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-[#1d4ed8]/25 ring-1 ring-[#1d4ed8]/40">
              <span className="text-sm font-bold text-[#93c5fd]">€</span>
            </div>
            <p className="mt-5 text-base font-semibold text-white">
              Pas encore d’abonnement
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#CBD5E1]">
              Votre organisation n’a pas encore d’abonnement ACV. Contactez le
              commercial Annex21 ou démarrez le checkout Stripe avec le devis
              signé.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => setShowDevis(true)}
                className="rounded-lg bg-[#1d4ed8] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#1e40af] disabled:opacity-50"
              >
                Démarrer le checkout
              </button>
              <a
                href={SALES_MAIL}
                className="rounded-lg border border-white/20 bg-transparent px-5 py-2.5 text-sm font-medium text-white hover:bg-white/5"
              >
                Contacter les ventes
              </a>
            </div>
            <p className="mt-6 text-xs text-[#CBD5E1]/80">
              Sales-led · ACV 10–30 k€/an · aucune clé Stripe côté client
            </p>
          </div>
        </>
      ) : null}

      {isDevis ? (
        <>
          <header>
            <h1 className="text-2xl font-semibold text-white">Devis ACV</h1>
            <p className="mt-1 text-sm text-[#CBD5E1]">
              Proposition commerciale · pas un sélecteur de tarifs self-serve
            </p>
          </header>

          <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
            <div
              className="card-glass rounded-2xl border border-white/10 px-6 py-6"
              data-luix-frame="billing-devis"
            >
              <span className="inline-flex rounded-full border border-[#1d4ed8]/40 bg-[#1d4ed8]/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#93c5fd]">
                Devis · sales-led
              </span>
              <h2 className="mt-4 text-lg font-semibold text-white">
                Abonnement ACV annuel
              </h2>
              <p className="mt-1 text-sm text-[#CBD5E1]">
                Montant contractualisé avec votre account manager — fourchette
                indicative.
              </p>
              <p className="mt-5 text-3xl font-semibold tracking-tight text-white">
                10–30 k€
                <span className="ml-2 text-base font-normal text-[#CBD5E1]">
                  / an · EUR
                </span>
              </p>

              <fieldset className="mt-5">
                <legend className="text-sm font-medium text-white">
                  Bande du devis ACV signé
                </legend>
                <p className="mt-1 text-xs text-[#CBD5E1]">
                  Sélectionnez la bande contractualisée avec le commercial
                  (sales-led — pas un sélecteur de tarifs self-serve).
                </p>
                <div
                  className="mt-3 grid grid-cols-3 gap-2"
                  role="radiogroup"
                  aria-label="Bande devis ACV"
                >
                  {(
                    [
                      { tier: '10k' as AcvTier, label: '10 k€' },
                      { tier: '20k' as AcvTier, label: '20 k€' },
                      { tier: '30k' as AcvTier, label: '30 k€' },
                    ] as const
                  ).map(({ tier, label }) => {
                    const selected = acvTier === tier;
                    return (
                      <button
                        key={tier}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setAcvTier(tier)}
                        className={
                          selected
                            ? 'rounded-lg border border-[#1d4ed8] bg-[#1d4ed8]/20 px-3 py-2.5 text-sm font-semibold text-white ring-1 ring-[#1d4ed8]/50'
                            : 'rounded-lg border border-white/15 bg-white/[0.03] px-3 py-2.5 text-sm font-medium text-[#CBD5E1] hover:bg-white/5'
                        }
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <dl className="mt-6 space-y-3 border-t border-white/10 pt-4 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-[#CBD5E1]">
                    Licence plateforme Annex21 (ACV)
                  </dt>
                  <dd className="text-white">
                    Devis {acvTier.replace('k', ' k€')}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-white/5 pt-3">
                  <dt className="text-[#CBD5E1]">Support &amp; SLA inclus</dt>
                  <dd className="font-medium text-emerald-300">Oui</dd>
                </div>
              </dl>

              <label className="mt-5 flex cursor-pointer gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <input
                  type="checkbox"
                  checked={includeFee}
                  onChange={(e) => setIncludeFee(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-white/20 accent-[#1d4ed8]"
                />
                <span className="text-left">
                  <span className="flex flex-wrap items-center gap-2 text-sm font-medium text-white">
                    Fee onboarding (optionnel)
                    <span className="rounded bg-teal-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-300">
                      Option
                    </span>
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-[#CBD5E1]">
                    5–15 k€ · une fois · accompagnement mise en service &amp;
                    playbooks. Ajouté au devis uniquement si validé avec le
                    commercial.
                  </span>
                </span>
              </label>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void startCheckout({ withFee: includeFee })}
                  className="rounded-lg bg-[#1d4ed8] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#1e40af] disabled:opacity-50"
                >
                  {busy ? 'Redirection…' : 'Payer le devis (Checkout)'}
                </button>
                <a
                  href={SALES_MAIL}
                  className="rounded-lg border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/10"
                >
                  Demander une révision
                </a>
                <button
                  type="button"
                  onClick={() => setShowDevis(false)}
                  className="text-sm text-[#CBD5E1] hover:text-white"
                >
                  ← Retour
                </button>
              </div>
            </div>

            <aside
              className="card-glass h-fit rounded-2xl border border-white/10 px-5 py-5"
              data-luix-frame="billing-help"
            >
              <h3 className="text-sm font-semibold text-white">
                Comment ça marche
              </h3>
              <ol className="mt-3 list-decimal space-y-2 pl-4 text-xs leading-relaxed text-[#CBD5E1]">
                <li>Le commercial envoie un devis ACV.</li>
                <li>
                  Vous démarrez le Checkout Stripe (session serveur).
                </li>
                <li>Webhook invoice.paid → statut active.</li>
              </ol>
              <p className="mt-4 text-xs font-semibold text-white">
                Aucune clé secrète Stripe n’est exposée dans l’UI.
              </p>
            </aside>
          </div>
        </>
      ) : null}

      {isPastDue && data ? (
        <>
          <header className="flex flex-wrap items-center gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-white">Facturation</h1>
              <p className="mt-1 text-sm text-[#CBD5E1]">
                Paiement en échec · action requise
              </p>
            </div>
            <BillingStatusBadge status="past_due" />
          </header>

          <div
            className="flex flex-col gap-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
            data-luix-frame="billing-past-due-banner"
          >
            <div className="flex flex-wrap items-start gap-3">
              <BillingStatusBadge status="past_due" />
              <div>
                <p className="text-sm font-semibold text-white">
                  Paiement échoué
                </p>
                <p className="mt-0.5 text-sm text-[#CBD5E1]">
                  La dernière tentative Stripe a échoué. Mettez à jour la carte
                  puis réessayez.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void startCheckout({ retry: true })}
                className="rounded-lg bg-[#b91c1c] px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {busy ? 'Redirection…' : 'Réessayer'}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void startCheckout({ retry: true })}
                className="rounded-lg border border-white/20 bg-transparent px-4 py-2 text-sm font-medium text-white hover:bg-white/5 disabled:opacity-50"
              >
                Mettre à jour le paiement
              </button>
            </div>
          </div>

          <div className="card-glass rounded-2xl border border-white/10 px-6 py-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-white">
                Abonnement ACV · {data.orgId}
              </h2>
              <BillingStatusBadge status="past_due" />
            </div>
            <p className="mt-3 text-sm text-[#CBD5E1]">
              Montant annuel : 18 000 € · prochaine échéance bloquée
            </p>
            <p className="mt-1 text-xs text-[#CBD5E1]/80">
              Dernière erreur : card_declined (référence serveur uniquement —
              pas de clé API).
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => void startCheckout({ retry: true })}
                className="rounded-lg bg-[#b91c1c] px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {busy ? 'Redirection…' : 'Réessayer'}
              </button>
              <a
                href={SUPPORT_MAIL}
                className="rounded-lg border border-white/20 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/5"
              >
                Contacter le support
              </a>
            </div>
          </div>
        </>
      ) : null}

      {isPending && data ? (
        <>
          <header>
            <h1 className="text-2xl font-semibold text-white">
              Activation en cours
            </h1>
            <p className="mt-1 text-sm text-[#CBD5E1]">
              Statut pending · en attente confirmation paiement
            </p>
          </header>

          <div
            className="card-glass mx-auto max-w-xl rounded-2xl border border-white/10 px-8 py-10 text-center"
            data-luix-frame="billing-pending"
          >
            <div className="flex justify-center">
              <BillingStatusBadge status="pending" />
            </div>
            <h2 className="mt-5 text-lg font-semibold text-white">
              Activation de votre abonnement…
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#CBD5E1]">
              Le checkout a été initié. Nous attendons le webhook Stripe
              (invoice.paid / subscription.active) pour activer le tenant. Cela
              prend généralement quelques secondes.
            </p>
            <div className="mx-auto mt-6 max-w-xs space-y-2" aria-hidden>
              <div className="h-2 animate-pulse rounded-full bg-white/10" />
              <div className="mx-auto h-2 w-[80%] animate-pulse rounded-full bg-white/10" />
              <div className="mx-auto h-2 w-[60%] animate-pulse rounded-full bg-white/10" />
            </div>
            <p className="mt-6 text-xs text-[#CBD5E1]">
              Session Checkout : créée côté serveur
            </p>
            <p className="mt-1 text-xs font-semibold text-white">
              Aucun secret Stripe visible dans le navigateur
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => void refresh()}
                className="rounded-lg border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/10"
              >
                Actualiser le statut
              </button>
              <a
                href={SALES_MAIL}
                className="rounded-lg border border-white/20 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/5"
              >
                Contacter les ventes
              </a>
            </div>
          </div>
        </>
      ) : null}

      {isActive && data ? (
        <>
          <header className="flex flex-wrap items-center gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-white">Facturation</h1>
              <p className="mt-1 text-sm text-[#CBD5E1]">
                Abonnement actif · renouvellement &amp; factures
              </p>
            </div>
            <BillingStatusBadge status="active" />
          </header>

          <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
            <div
              className="card-glass rounded-2xl border border-white/10 px-6 py-6"
              data-luix-frame="billing-active"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-white">
                  Abonnement ACV
                </h2>
                <BillingStatusBadge status="active" />
              </div>
              <p className="mt-4 text-3xl font-semibold tracking-tight text-white">
                18 000 €
                <span className="ml-2 text-base font-normal text-[#CBD5E1]">
                  / an · EUR
                </span>
              </p>
              <p className="mt-2 text-sm text-[#CBD5E1]">
                {data.updatedAt ? (
                  <>
                    Prochain renouvellement /{' '}
                    {renewalLabel(data.updatedAt)}
                  </>
                ) : (
                  'Prochain renouvellement : selon devis (API)'
                )}
              </p>
              <p className="mt-1 text-xs text-[#CBD5E1]/80">
                Fee onboarding : optionnel · montant selon devis commercial
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/5"
                  disabled
                  title="Bientôt disponible"
                >
                  Voir le devis
                </button>
                <a
                  href={SALES_MAIL}
                  className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/5"
                >
                  Contacter le commercial
                </a>
              </div>
            </div>

            <aside className="card-glass rounded-2xl border border-white/10 px-5 py-5">
              <p className="text-xs uppercase tracking-wide text-[#CBD5E1]">
                Organisation
              </p>
              <p className="mt-2 text-base font-semibold text-white">
                {data.orgId}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-[#CBD5E1]">
                Customer / Subscription liés côté admin plateforme (Back
                Office). UI front : zéro clé secrète Stripe.
              </p>
            </aside>
          </div>

          <div
            className="card-glass rounded-2xl border border-white/10 px-6 py-5"
            data-luix-frame="billing-invoices"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-white">Factures</h2>
              <span className="text-xs text-[#CBD5E1]">
                État active · liste stub (API sans factures)
              </span>
            </div>
            <ul className="mt-4 divide-y divide-white/10">
              {STUB_INVOICES.map((inv) => (
                <li
                  key={inv.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
                >
                  <div>
                    <span className="font-medium text-white">{inv.id}</span>
                    <span className="ml-2 text-[#CBD5E1]">{inv.dateLabel}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white">{inv.amount}</span>
                    <span className="rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                      Payée
                    </span>
                    <span
                      className="cursor-not-allowed text-sm text-[#1d4ed8]/50"
                      title="PDF indisponible (stub)"
                      aria-disabled
                    >
                      PDF
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : null}


    </div>
  );
}

function renewalLabel(updatedAt: string): string {
  const d = new Date(updatedAt);
  d.setFullYear(d.getFullYear() + 1);
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
