'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/logo';
import { ONBOARDING_DONE_KEY } from '@/lib/onboarding';

const NIS2_SECTORS = [
  'Infrastructure numérique',
  'Fournisseur de services numériques',
  'Industrie manufacturière',
  'Énergie',
  'Transports',
  'Santé',
  'Eau potable / eaux usées',
  'Administration publique',
  'Espace',
  'Autre secteur important NIS2',
] as const;

const ROLES = [
  {
    id: 'ciso',
    label: 'CISO / RSSI — pilote conformité',
  },
  {
    id: 'contributor',
    label: 'Contributor — IT / SecOps',
  },
  {
    id: 'viewer',
    label: 'Viewer — direction',
  },
] as const;

const STORAGE_KEY = 'annex21_onboarding_org';

function markOnboardingDone() {
  try {
    sessionStorage.setItem(ONBOARDING_DONE_KEY, '1');
  } catch {
    /* sessionStorage indisponible */
  }
  try {
    localStorage.setItem(ONBOARDING_DONE_KEY, '1');
  } catch {
    /* localStorage indisponible */
  }
}

export default function OnboardingOrgPage() {
  const router = useRouter();
  const [orgName, setOrgName] = useState('Acme Industrie SAS');
  const [sector, setSector] = useState<string>(NIS2_SECTORS[0]);
  const [role, setRole] = useState<string>('ciso');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        orgName?: string;
        sector?: string;
        role?: string;
      };
      if (parsed.orgName) setOrgName(parsed.orgName);
      if (parsed.sector) setSector(parsed.sector);
      if (parsed.role) setRole(parsed.role);
    } catch {
      /* ignore */
    }
  }, []);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          orgName: orgName.trim(),
          sector,
          role,
          completedAt: new Date().toISOString(),
        }),
      );
    } catch {
      /* sessionStorage indisponible */
    }
    markOnboardingDone();
    router.push('/app');
  }

  return (
    <div className="surface-void flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <Logo href="/" mark />
      <div className="card-glass mt-8 w-full max-w-lg rounded-2xl p-8">
        <span className="inline-flex rounded-full border border-annex-mint/40 bg-annex-mint/15 px-2.5 py-0.5 text-[11px] font-semibold text-annex-mint">
          Étape 1/2 — Organisation
        </span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-[#F8FAFC]">
          Présentez votre organisation
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#CBD5E1]">
          Ces informations cadrent l&apos;assessment NIS2. Ensuite : brancher les connecteurs
          (/app).
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-5">
          <label className="block text-sm text-[#CBD5E1]">
            Nom de l&apos;organisation
            <input
              type="text"
              required
              minLength={2}
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-[#F8FAFC] outline-none ring-annex-blue placeholder:text-slate-500 focus:ring-2"
              placeholder="Acme Industrie SAS"
            />
          </label>

          <label className="block text-sm text-[#CBD5E1]">
            Secteur NIS2
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="mt-1.5 w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-[#F8FAFC] outline-none ring-annex-blue focus:ring-2"
            >
              {NIS2_SECTORS.map((s) => (
                <option key={s} value={s} className="bg-[#0B1220] text-[#F8FAFC]">
                  {s}
                </option>
              ))}
            </select>
          </label>

          <fieldset>
            <legend className="text-sm text-[#CBD5E1]">Votre rôle</legend>
            <div className="mt-2 space-y-2">
              {ROLES.map((r) => {
                const selected = role === r.id;
                return (
                  <label
                    key={r.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-sm transition ${
                      selected
                        ? 'border-annex-deep bg-annex-deep/40 text-white ring-1 ring-annex-blue/50'
                        : 'border-white/15 bg-transparent text-[#CBD5E1] hover:bg-white/5'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={r.id}
                      checked={selected}
                      onChange={() => setRole(r.id)}
                      className="h-4 w-4 accent-annex-blue"
                    />
                    <span className="font-medium">{r.label}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={pending || orgName.trim().length < 2}
            className="w-full rounded-full bg-annex-deep px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {pending ? 'Suite…' : 'Continuer'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-[#CBD5E1]">
          Ensuite : brancher M365 / Google / AWS
        </p>
      </div>
    </div>
  );
}
