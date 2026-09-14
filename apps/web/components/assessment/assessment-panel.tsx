'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type {
  AssessmentAnswers,
  AssessmentGap,
  Control,
  Nis2Assessment,
  Nis2Domain,
} from '@annex21/shared';
import { ASSESSMENT_DISCLAIMER_FR, NIS2_DOMAIN_LABELS } from '@annex21/shared';
import {
  completeAssessment,
  createAssessment,
  DEFAULT_ORG,
  listAssessments,
  listControls,
  updateAssessment,
  updateControl,
} from '@/lib/app-api';

/** Figma severity pills: Critique / Majeur / Mineur */
const SEVERITY_FR: Record<string, string> = {
  eleve: 'Critique',
  moyen: 'Majeur',
  faible: 'Mineur',
};

const SEVERITY_CLS: Record<string, string> = {
  eleve: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  moyen: 'bg-orange-400/15 text-orange-200 border-orange-400/30',
  faible: 'bg-annex-mint/15 text-annex-mint border-annex-mint/50',
};

const SCOPE_FR: Record<string, string> = {
  in_scope: 'in_scope',
  out_of_scope: 'out_of_scope',
  unclear: 'unclear',
};

const DOMAINS: Nis2Domain[] = [
  'gouvernance',
  'risques',
  'continuite',
  'incidents',
  'supply_chain',
  'formation',
];

type View = 'loading' | 'empty' | 'draft' | 'result' | 'gap' | 'error';

export function AssessmentPanel() {
  const [view, setView] = useState<View>('loading');
  const [assessment, setAssessment] = useState<Nis2Assessment | null>(null);
  const [controls, setControls] = useState<Control[]>([]);
  const [selectedGap, setSelectedGap] = useState<AssessmentGap | null>(null);
  const [ack, setAck] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [list, ctrls] = await Promise.all([
        listAssessments(DEFAULT_ORG),
        listControls(DEFAULT_ORG),
      ]);
      setControls(ctrls);
      const latest = list[0] ?? null;
      setAssessment(latest);
      if (!latest) setView('empty');
      else if (latest.status === 'draft') setView('draft');
      else setView('result');
      setErr(null);
    } catch {
      setView('error');
      setErr('API indisponible — démarrer apps/api (stub auth).');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function start() {
    setBusy(true);
    setView('loading');
    try {
      const created = await createAssessment(DEFAULT_ORG, {
        sector: 'industrie',
        headcountBand: '50_249',
        digitalActivities: true,
        criticalDependencies: true,
        domainMaturity: {
          gouvernance: 70,
          risques: 55,
          continuite: 48,
          incidents: 72,
          supply_chain: 40,
          formation: 60,
        },
      });
      setAssessment(created);
      setView('draft');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erreur création');
      setView('error');
    } finally {
      setBusy(false);
    }
  }

  async function patchAnswers(partial: AssessmentAnswers) {
    if (!assessment || assessment.status !== 'draft') return;
    setBusy(true);
    try {
      const updated = await updateAssessment(assessment.id, partial);
      setAssessment(updated);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erreur maj');
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
    if (!assessment || !ack) return;
    setBusy(true);
    setView('loading');
    try {
      const done = await completeAssessment(assessment.id);
      setAssessment(done);
      setView('result');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erreur complete');
      setView('draft');
    } finally {
      setBusy(false);
    }
  }

  async function onControlStatus(id: string, status: Control['status']) {
    try {
      const updated = await updateControl(id, { status });
      setControls((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erreur contrôle');
    }
  }

  /* —— Frame 02 skeleton —— */
  if (view === 'loading') {
    return (
      <div data-luix-frame="02-assessment-skeleton" data-figma-node="14:44">
        <h1 className="text-2xl font-semibold text-white">Assessment NIS2</h1>
        <p className="mt-1 text-sm text-[#CBD5E1]">Analyse en cours…</p>
        <div className="mt-6 grid gap-4 lg:grid-cols-[200px_1fr]">
          <div className="card-glass space-y-3 rounded-2xl p-5">
            <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
            <div className="h-10 w-16 animate-pulse rounded bg-white/10" />
            <div className="h-1.5 w-full animate-pulse rounded-full bg-white/10" />
          </div>
          <div className="card-glass space-y-4 rounded-2xl p-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-2/3 animate-pulse rounded bg-white/10" />
                  <div className="h-2.5 w-full animate-pulse rounded bg-white/5" />
                </div>
                <div className="h-6 w-16 animate-pulse rounded-full bg-white/10" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'error') {
    return (
      <div className="card-glass rounded-2xl p-6">
        <p className="text-sm text-rose-300">{err}</p>
        <button
          type="button"
          onClick={() => void refresh()}
          className="mt-4 rounded-full border border-white/15 px-4 py-2 text-sm text-[#CBD5E1] hover:bg-white/5"
        >
          Réessayer
        </button>
      </div>
    );
  }

  /* —— Frame 01 empty —— */
  if (view === 'empty') {
    return (
      <div data-luix-frame="01-assessment-empty" data-figma-node="14:3">
        <h1 className="text-2xl font-semibold text-white">Assessment NIS2</h1>
        <p className="mt-1 text-sm text-[#CBD5E1]">
          Évaluez votre périmètre et maturité en ≤15 minutes · FR-ANSSI
        </p>
        <div className="mx-auto mt-10 max-w-lg card-glass rounded-2xl p-8 text-center">
          <span className="inline-flex rounded-lg bg-annex-deep/50 px-2.5 py-1 text-[11px] font-semibold text-annex-blue ring-1 ring-annex-blue/40">
            NIS2
          </span>
          <h2 className="mt-4 text-lg font-semibold text-white">Aucun assessment démarré</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-[#CBD5E1]">
            Questionnaire guidé (secteur, taille, activités, dépendances) pour obtenir un statut
            in_scope / out_of_scope et un score de maturité.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void start()}
            className="mt-6 rounded-full bg-annex-deep px-5 py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            Démarrer l&apos;assessment
          </button>
          <p className="mt-6 text-xs text-[#CBD5E1]">Disclaimer : non avis juridique (RG-02)</p>
        </div>
      </div>
    );
  }

  /* —— Draft questionnaire —— */
  if (view === 'draft' && assessment) {
    const a = assessment.answers;
    return (
      <div data-luix-frame="assessment-draft" className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white">Assessment NIS2 — brouillon</h1>
            <p className="mt-1 text-sm text-[#CBD5E1]">
              Version {assessment.version} · reprenez à tout moment (US-AS05)
            </p>
          </div>
          <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs text-amber-200">
            Brouillon
          </span>
        </div>

        <section className="card-glass grid gap-4 rounded-2xl p-5 md:grid-cols-2">
          <label className="block text-sm">
            <span className="text-[#CBD5E1]">Secteur</span>
            <input
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white"
              value={a.sector ?? ''}
              onChange={(e) => void patchAnswers({ sector: e.target.value })}
            />
          </label>
          <label className="block text-sm">
            <span className="text-[#CBD5E1]">Effectif</span>
            <select
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white"
              value={a.headcountBand ?? '50_249'}
              onChange={(e) =>
                void patchAnswers({
                  headcountBand: e.target.value as AssessmentAnswers['headcountBand'],
                })
              }
            >
              <option value="lt50">&lt; 50</option>
              <option value="50_249">50–249</option>
              <option value="250_plus">250+</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-[#CBD5E1]">
            <input
              type="checkbox"
              checked={!!a.digitalActivities}
              onChange={(e) => void patchAnswers({ digitalActivities: e.target.checked })}
            />
            Activités numériques essentielles / importantes
          </label>
          <label className="flex items-center gap-2 text-sm text-[#CBD5E1]">
            <input
              type="checkbox"
              checked={!!a.criticalDependencies}
              onChange={(e) => void patchAnswers({ criticalDependencies: e.target.checked })}
            />
            Dépendances critiques cloud / IdP / MSP
          </label>
        </section>

        <section className="card-glass rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white">Maturité par domaine (0–100)</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {DOMAINS.map((d) => (
              <label key={d} className="block text-xs text-[#CBD5E1]">
                {NIS2_DOMAIN_LABELS[d]}
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={a.domainMaturity?.[d] ?? 50}
                  className="mt-1 w-full"
                  onChange={(e) =>
                    void patchAnswers({
                      domainMaturity: {
                        ...(a.domainMaturity ?? {}),
                        [d]: Number(e.target.value),
                      },
                    })
                  }
                />
                <span className="text-white">{a.domainMaturity?.[d] ?? 50}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="card-glass rounded-2xl p-5">
          <label className="flex items-start gap-3 text-sm text-[#CBD5E1]">
            <input
              type="checkbox"
              className="mt-1"
              checked={ack}
              onChange={(e) => setAck(e.target.checked)}
            />
            <span>
              {ASSESSMENT_DISCLAIMER_FR}
              <span className="mt-1 block text-xs text-slate-500">
                Acknowledgement obligatoire pour valider (disclaimer_ack).
              </span>
            </span>
          </label>
          <button
            type="button"
            disabled={!ack || busy}
            onClick={() => void finish()}
            className="mt-4 rounded-full bg-annex-deep px-5 py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-40"
          >
            Valider le résultat
          </button>
        </section>
        {err && <p className="text-xs text-rose-300">{err}</p>}
      </div>
    );
  }

  /* —— Frame 04 gap detail —— */
  if (view === 'gap' && selectedGap && assessment) {
    const g = selectedGap;
    const related = controls.filter((c) =>
      c.domain.toLowerCase().includes(
        NIS2_DOMAIN_LABELS[g.domain].split(' ')[0]?.toLowerCase() ?? '',
      ) || c.code.toLowerCase().includes(g.domain.slice(0, 4)),
    );
    return (
      <div data-luix-frame="04-gap-detail" data-figma-node="14:126" className="space-y-6">
        <button
          type="button"
          onClick={() => {
            setSelectedGap(null);
            setView('result');
          }}
          className="text-xs text-annex-blue hover:underline"
        >
          ← Retour résultats
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-white">
            Gap · {NIS2_DOMAIN_LABELS[g.domain]}
          </h1>
          <p className="mt-1 text-sm text-[#CBD5E1]">
            {SEVERITY_FR[g.severity]} · Assessment v{assessment.version}
            {g.dueHint ? ` · échéance ${g.dueHint}` : ''}
          </p>
        </div>

        <section className="card-glass rounded-2xl p-6">
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full border px-2.5 py-0.5 text-[11px] ${SEVERITY_CLS[g.severity]}`}>
              {SEVERITY_FR[g.severity]}
            </span>
            <span className="rounded-full border border-annex-blue/30 bg-annex-deep/30 px-2.5 py-0.5 text-[11px] text-annex-blue">
              Art. 21 · {NIS2_DOMAIN_LABELS[g.domain]}
            </span>
          </div>
          <h2 className="mt-4 text-lg font-semibold text-white">{g.title}</h2>
          <p className="mt-2 text-sm text-[#CBD5E1]">{g.detail}</p>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-[11px] text-[#CBD5E1]">Impact</p>
              <p className="text-sm text-white">{g.priorityScore >= 6 ? 'Élevé' : g.priorityScore >= 4 ? 'Moyen' : 'Faible'}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#CBD5E1]">Effort</p>
              <p className="text-sm text-white">Moyen</p>
            </div>
            <div>
              <p className="text-[11px] text-[#CBD5E1]">Owner</p>
              <p className="text-sm text-white">{g.ownerRole ?? 'Non assigné'}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#CBD5E1]">Échéance</p>
              <p className="text-sm text-white">{g.dueHint ?? '—'}</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href={
                (related[0] ?? controls[0])
                  ? `/app/controls/${(related[0] ?? controls[0]).id}`
                  : '/app/controls'
              }
              className="rounded-full bg-annex-deep px-4 py-2 text-sm font-semibold hover:bg-blue-700"
            >
              Traiter contrôle
            </Link>
            <Link
              href="/app/playbooks"
              className="rounded-full border border-white/15 px-4 py-2 text-sm text-[#CBD5E1] hover:bg-white/5"
            >
              Ouvrir playbook incident
            </Link>
          </div>
        </section>

        <section className="card-glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white">Contrôles liés</h3>
          <ul className="mt-3 divide-y divide-white/5">
            {(related.length ? related : controls.slice(0, 2)).map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2.5">
                <Link href={`/app/controls/${c.id}`} className="text-sm text-white hover:text-annex-blue">
                  <span className="text-xs text-annex-mint">{c.code}</span> {c.title}
                </Link>
                <span className="text-xs text-[#CBD5E1]">
                  {c.status === 'implemented'
                    ? 'Implémenté'
                    : c.status === 'in_progress'
                      ? 'En cours'
                      : 'À faire'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    );
  }

  /* —— Frame 03 résultat —— */
  const score = assessment?.maturityScore ?? 0;
  const gaps = assessment?.gaps ?? [];
  return (
    <div data-luix-frame="03-assessment-resultat" data-figma-node="14:85" className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Assessment — résultats NIS2</h1>
          <p className="text-sm text-[#CBD5E1]">
            Statut {assessment?.scopeStatus ? SCOPE_FR[assessment.scopeStatus] : '—'} ·{' '}
            {gaps.length} gaps priorisés · score de maturité {score}%
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void start()}
          className="rounded-full border border-white/15 px-4 py-2 text-sm text-[#CBD5E1] hover:bg-white/5"
        >
          Nouvel assessment
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[200px_1fr]">
        <div className="card-glass rounded-2xl p-5">
          <p className="text-xs text-[#CBD5E1]">Maturité NIS2</p>
          <p className="mt-1 text-4xl font-semibold text-white">{score}%</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-annex-deep to-annex-mint"
              style={{ width: `${score}%` }}
            />
          </div>
          <p className="mt-3 text-[11px] text-[#CBD5E1]">
            {assessment?.scopeStatus ?? '—'} · Acme SA
          </p>
        </div>

        <div className="card-glass rounded-2xl">
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
            <p className="text-sm font-medium text-white">Gaps priorisés (critique → mineur)</p>
            <span className="text-[11px] text-[#CBD5E1]">impact × effort</span>
          </div>
          <ul className="divide-y divide-white/5">
            {gaps.length === 0 && (
              <li className="px-5 py-4 text-sm text-[#CBD5E1]">Aucun gap prioritaire.</li>
            )}
            {gaps.map((g) => (
              <li key={g.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedGap(g);
                    setView('gap');
                  }}
                  className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left hover:bg-white/5"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{NIS2_DOMAIN_LABELS[g.domain]}</p>
                    <p className="text-xs text-[#CBD5E1]">
                      {g.title}
                      {g.ownerRole ? '' : ' · owner non assigné'}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] ${SEVERITY_CLS[g.severity]}`}
                  >
                    {SEVERITY_FR[g.severity]}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <section className="card-glass flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5">
        <div>
          <p className="text-sm font-semibold text-white">Playbook incident · notification 24h</p>
          <p className="text-xs text-[#CBD5E1]">
            Étapes ANSSI : détecter → qualifier → notifier → contenir.
          </p>
        </div>
        <Link
          href="/app/playbooks"
          className="rounded-full bg-annex-deep px-4 py-2 text-sm font-semibold hover:bg-blue-700"
        >
          Ouvrir playbook incident
        </Link>
      </section>

      <section className="card-glass rounded-2xl p-5" data-luix-frame="controls-status">
        <h2 className="text-sm font-semibold text-white">Contrôles org</h2>
        <ul className="mt-3 divide-y divide-white/5">
          {controls.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <div>
                <p className="text-sm text-white">
                  <span className="text-xs text-annex-mint">{c.code}</span> {c.title}
                </p>
                <p className="text-xs text-[#CBD5E1]">{c.domain}</p>
              </div>
              <select
                className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-[#CBD5E1]"
                value={c.status}
                onChange={(e) =>
                  void onControlStatus(c.id, e.target.value as Control['status'])
                }
              >
                <option value="not_started">Non démarré</option>
                <option value="in_progress">En cours</option>
                <option value="implemented">Implémenté</option>
                <option value="not_applicable">N/A</option>
              </select>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-[#CBD5E1]">
        Disclaimer : cet assessment n&apos;est pas un avis juridique (RG-02).
      </p>
    </div>
  );
}
