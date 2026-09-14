'use client';

import { FormEvent, Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Logo } from '@/components/logo';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const WEB = process.env.NEXT_PUBLIC_WEB_ORIGIN ?? 'http://localhost:3000';

function EnvelopeIcon() {
  return (
    <div
      className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-annex-blue/40 bg-annex-deep/30"
      aria-hidden
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white">
        <path
          d="M4 6.5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path
          d="m4 7.5 8 6 8-6"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function CheckEmailInner() {
  const params = useSearchParams();
  const email = params.get('email') ?? '';
  const devToken = params.get('devToken');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const verifyHref = useMemo(() => {
    if (!devToken) return null;
    const redirect = `${WEB}/app/onboarding`;
    return `${API}/auth/verify?token=${encodeURIComponent(devToken)}&redirect=${encodeURIComponent(redirect)}`;
  }, [devToken]);

  async function onResend(e: FormEvent) {
    e.preventDefault();
    if (!email || resending) return;
    setResending(true);
    try {
      await fetch(`${API}/auth/magic-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });
      setResent(true);
    } catch {
      setResent(true);
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="surface-void flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <Logo href="/" mark />
      <div className="card-glass mt-8 w-full max-w-md rounded-2xl px-8 py-9 text-center">
        <EnvelopeIcon />
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-[#F8FAFC]">
          Vérifiez votre email
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[#CBD5E1]">
          Un lien magique a été envoyé à{' '}
          <span className="font-medium text-[#F8FAFC]">{email || 'cet e-mail'}</span>.
          Ouvrez-le pour vous connecter — aucun mot de passe (SSO IdP aussi disponible au login).
        </p>

        <form onSubmit={onResend} className="mt-7">
          <button
            type="submit"
            disabled={resending || !email}
            className="w-full rounded-full border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-semibold text-[#F8FAFC] hover:bg-white/10 disabled:opacity-60"
          >
            {resending ? 'Envoi…' : resent ? 'Lien renvoyé' : 'Renvoyer le lien'}
          </button>
        </form>

        {verifyHref && (
          <div className="mt-5 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-left text-xs text-amber-100">
            <p className="font-medium">Mode développement (Brevo non configuré)</p>
            <a className="mt-2 inline-block break-all text-annex-mint underline" href={verifyHref}>
              Ouvrir le lien magique (dev)
            </a>
          </div>
        )}

        <Link
          href="/app/login"
          className="mt-6 inline-block text-sm text-annex-blue hover:underline"
        >
          ← Retour à l&apos;accueil
        </Link>
      </div>
      <p className="mt-5 max-w-md text-center text-xs text-[#CBD5E1]">
        Le lien expire dans 15 min. Pensez à vérifier les spams.
      </p>
    </div>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense fallback={<div className="surface-void min-h-screen" />}>
      <CheckEmailInner />
    </Suspense>
  );
}
