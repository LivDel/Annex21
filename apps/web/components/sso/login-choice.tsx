'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/logo';
import type { SsoLoginOptionsResponse } from '@annex21/shared';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/**
 * Figma 01 — Login choix IdP + magic link fallback.
 * data-luix-frame=01-login-choix
 */
export function LoginChoice() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<SsoLoginOptionsResponse | null>(null);

  useEffect(() => {
    void fetch(`${API}/auth/sso/options`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d: SsoLoginOptionsResponse) => setOptions(d))
      .catch(() =>
        // No client-side IdP presets — API owns production gating
        setOptions({ options: [], magicLinkAvailable: true }),
      );
  }, []);

  function idpLabel(provider: string, displayName: string): string {
    if (provider === 'entra') return 'Continuer avec Entra ID';
    if (provider === 'google') return 'Continuer avec Google Workspace';
    return `Continuer avec ${displayName}`;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`${API}/auth/magic-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });
      if (!res.ok && res.status >= 500) {
        setError('Service momentanément indisponible. Réessayez.');
        setPending(false);
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { devToken?: string };
      const q = new URLSearchParams({ email });
      if (data.devToken) q.set('devToken', data.devToken);
      router.push(`/app/login/check-email?${q.toString()}`);
    } catch {
      router.push(`/app/login/check-email?email=${encodeURIComponent(email)}`);
    } finally {
      setPending(false);
    }
  }

  const buttons = options?.options ?? [];

  return (
    <div
      className="surface-void flex min-h-screen flex-col items-center justify-center px-4 py-10"
      data-luix-frame="01-login-choix"
      data-figma-node="38:3"
    >
      <div className="card-glass w-full max-w-md rounded-2xl p-8">
        <div className="flex justify-center">
          <Logo href="/" mark />
        </div>
        <h1 className="mt-6 text-center text-2xl font-semibold tracking-tight text-[#F8FAFC]">
          Connexion
        </h1>
        <p className="mt-2 text-center text-sm text-[#CBD5E1]">
          Utilisez votre IdP d&apos;entreprise (OIDC / SAML) ou un lien magique
          pour démarrer.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          {buttons.map((opt) => (
            <a
              key={opt.idpId}
              href={`${API}${opt.startPath}`}
              className="inline-flex w-full items-center justify-center rounded-full bg-annex-deep px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-annex-blue"
            >
              {idpLabel(opt.provider, opt.displayName)}
            </a>
          ))}
        </div>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-[#CBD5E1]">ou</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <p className="text-xs text-[#CBD5E1]">
          Lien magique (fallback / bootstrap)
        </p>
        <form onSubmit={onSubmit} className="mt-2 space-y-4">
          <label className="block text-sm text-[#CBD5E1]">
            <span className="sr-only">E-mail professionnel</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-[#F8FAFC] outline-none ring-annex-blue placeholder:text-slate-500 focus:ring-2"
              placeholder="j.martin@acme.fr"
            />
          </label>
          {error && (
            <p className="text-sm font-medium text-red-300">{error}</p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full border border-white/20 bg-transparent px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/5 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-annex-blue"
          >
            {pending ? 'Envoi…' : 'Recevoir un lien magique'}
          </button>
        </form>

        <p className="mt-4 text-center text-[11px] leading-relaxed text-[#CBD5E1]/70">
          Pas de login social public · IdP OIDC/SAML configurés uniquement
        </p>
      </div>
      <p className="mt-4 text-[10px] text-[#CBD5E1]/50">
        Focus-visible · Tab entre IdP et lien magique
      </p>
    </div>
  );
}
