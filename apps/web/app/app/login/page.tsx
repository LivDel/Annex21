'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/logo';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      // Toujours traiter comme succès UX (pas d'énumération) sauf erreur réseau
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
      // Hors ligne : message générique succès pour ne pas fuiter
      router.push(`/app/login/check-email?email=${encodeURIComponent(email)}`);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="surface-void flex min-h-screen items-center justify-center px-4">
      <div className="card-glass w-full max-w-md rounded-2xl p-8">
        <Logo href="/" />
        <h1 className="mt-6 text-2xl font-semibold text-white">Connexion</h1>
        <p className="mt-2 text-sm text-slate-400">
          Recevez un lien magique par e-mail — aucune preuve ni secret sur le Trust public.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm text-slate-300">
            E-mail professionnel
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white outline-none ring-annex-blue focus:ring-2"
              placeholder="ciso@entreprise.fr"
            />
          </label>
          {error && <p className="text-sm text-rose-300">{error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full bg-annex-deep px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {pending ? 'Envoi…' : 'Recevoir le lien magique'}
          </button>
        </form>
      </div>
    </div>
  );
}
