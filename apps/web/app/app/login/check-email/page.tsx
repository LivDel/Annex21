'use client';

import { Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Logo } from '@/components/logo';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const WEB = process.env.NEXT_PUBLIC_WEB_ORIGIN ?? 'http://localhost:3000';

function CheckEmailInner() {
  const params = useSearchParams();
  const email = params.get('email') ?? '';
  const devToken = params.get('devToken');
  const verifyHref = useMemo(() => {
    if (!devToken) return null;
    const redirect = `${WEB}/app`;
    return `${API}/auth/verify?token=${encodeURIComponent(devToken)}&redirect=${encodeURIComponent(redirect)}`;
  }, [devToken]);

  return (
    <div className="surface-void flex min-h-screen items-center justify-center px-4">
      <div className="card-glass w-full max-w-md rounded-2xl p-8">
        <Logo href="/" />
        <h1 className="mt-6 text-2xl font-semibold text-white">Vérifiez votre boîte mail</h1>
        <p className="mt-3 text-sm text-slate-300">
          Si un compte existe pour{' '}
          <span className="font-medium text-white">{email || 'cet e-mail'}</span>, un lien de
          connexion a été envoyé. Il expire dans 15 minutes.
        </p>
        <p className="mt-3 text-sm text-slate-400">
          Pensez à vérifier les spams. Vous pouvez fermer cette page.
        </p>
        {verifyHref && (
          <div className="mt-5 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-xs text-amber-100">
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
          ← Utiliser un autre e-mail
        </Link>
      </div>
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
