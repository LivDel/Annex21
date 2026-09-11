'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type ToastKind = 'success' | 'warning' | 'error';

const COPY: Record<
  ToastKind,
  { title: string; body: string; border: string; titleColor: string }
> = {
  success: {
    title: 'Paiement confirmé',
    body: 'Checkout réussi. L’abonnement ACV sera activé dès réception du webhook Stripe.',
    border: 'border-l-emerald-400',
    titleColor: 'text-emerald-200',
  },
  warning: {
    title: 'Checkout annulé',
    body: 'Vous avez quitté Stripe Checkout. Aucun paiement n’a été effectué.',
    border: 'border-l-amber-400',
    titleColor: 'text-amber-200',
  },
  error: {
    title: 'Échec du paiement',
    body: 'La tentative de paiement a échoué. Aucune clé Stripe n’est affichée. Réessayez ou contactez le support.',
    border: 'border-l-red-500',
    titleColor: 'text-red-200',
  },
};

function mapParam(v: string | null): ToastKind | null {
  if (v === 'success') return 'success';
  if (v === 'cancel') return 'warning';
  if (v === 'error') return 'error';
  return null;
}

/**
 * Top-right toast when `?checkout=success|cancel|error` (Figma 32:87).
 * Must be wrapped in Suspense (useSearchParams).
 */
export function BillingCheckoutToast() {
  const params = useSearchParams();
  const kind = mapParam(params.get('checkout'));
  const [open, setOpen] = useState(Boolean(kind));

  useEffect(() => {
    setOpen(Boolean(kind));
  }, [kind]);

  if (!kind || !open) return null;

  const c = COPY[kind];

  return (
    <div
      className="pointer-events-none fixed right-6 top-6 z-50 w-full max-w-sm"
      role="status"
      aria-live="polite"
      data-luix-frame="billing-toast"
    >
      <div
        className={`pointer-events-auto card-glass rounded-xl border border-white/10 border-l-4 ${c.border} px-4 py-3 shadow-lg`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={`text-sm font-semibold ${c.titleColor}`}>{c.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-[#CBD5E1]">
              {c.body}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="shrink-0 rounded-md px-1.5 text-sm text-[#CBD5E1] hover:bg-white/10 hover:text-white"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
