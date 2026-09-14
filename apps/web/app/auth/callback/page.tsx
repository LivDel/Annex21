'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Logo } from '@/components/logo';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function CallbackInner() {
  const params = useSearchParams();
  const error = params.get('error');
  const messageParam = params.get('message');
  const [message, setMessage] = useState<string | null>(messageParam);

  useEffect(() => {
    if (!error || messageParam) return;
    void fetch(
      `${API}/auth/sso/error-message?code=${encodeURIComponent(error)}`,
    )
      .then((r) => r.json())
      .then((d: { message?: string }) =>
        setMessage(
          d.message ??
            'La connexion SSO a échoué. Réessayez ou utilisez un lien magique.',
        ),
      )
      .catch(() =>
        setMessage(
          'La connexion SSO a échoué. Réessayez ou utilisez un lien magique.',
        ),
      );
  }, [error, messageParam]);

  if (error) {
    return (
      <div
        className="surface-void flex min-h-screen flex-col items-center justify-center px-4"
        data-luix-frame="08-callback-erreur"
        data-figma-node="40:38"
      >
        <div className="card-glass w-full max-w-md rounded-2xl p-8 text-center">
          <Logo href="/" mark />
          <h1 className="mt-6 text-xl font-semibold text-[#F8FAFC]">
            Connexion impossible
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#CBD5E1]">
            {message ?? 'Chargement du message…'}
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/app/login"
              className="rounded-full bg-annex-deep px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Réessayer
            </Link>
            <Link
              href="/app/login"
              className="text-sm text-[#CBD5E1] underline-offset-2 hover:underline"
            >
              Retour au login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="surface-void flex min-h-screen flex-col items-center justify-center px-4"
      data-luix-frame="07-callback-loading"
      data-figma-node="40:23"
    >
      <div className="card-glass w-full max-w-md rounded-2xl p-8">
        <div className="mx-auto h-10 w-10 animate-pulse rounded-full bg-annex-deep/40" />
        <div className="mt-6 space-y-3">
          <div className="h-4 animate-pulse rounded bg-white/10" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-white/10" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-white/5" />
        </div>
        <p className="mt-6 text-center text-sm text-[#CBD5E1]">
          Finalisation de la connexion SSO…
        </p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="surface-void flex min-h-screen items-center justify-center">
          <p className="text-sm text-[#CBD5E1]">Chargement…</p>
        </div>
      }
    >
      <CallbackInner />
    </Suspense>
  );
}
