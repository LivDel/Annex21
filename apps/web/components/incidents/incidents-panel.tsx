'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Incident, IncidentSlaCountdown, IncidentStep, SlaWindow } from '@annex21/shared';
import {
  closeIncident,
  completeStep,
  DEFAULT_ORG,
  formatRemaining,
  linkStepEvidence,
  listIncidentSla,
  listIncidents,
} from '@/lib/app-api';
import { SlaIncidentBanner } from '@/components/sla-banner';

/** Stub evidence ids (seed API) — frame 07. */
const EVIDENCE_STUBS = [
  { id: 'ev_1', label: 'politique-ssi-2026.pdf', meta: 'Manuel · seed' },
  { id: 'ev_2', label: 'idp-mfa-export.json', meta: 'Connecteur · seed' },
];

const WINDOW_FR: Record<SlaWindow, string> = {
  '24h': '24h',
  '72h': '72h',
  '1m': '1 mois',
};

function StepEvidenceBlock({
  step,
  busy,
  evidencePick,
  onPick,
  onLink,
  onComplete,
}: {
  step: IncidentStep;
  busy: boolean;
  evidencePick: string;
  onPick: (id: string) => void;
  onLink: () => void;
  onComplete: () => void;
}) {
  const linked = step.evidenceLinks.length > 0;
  const blocked = step.requiresEvidence && !linked;
  const optionalWarn = !step.requiresEvidence && !linked;

  if (step.status === 'done') {
    return (
      <div className="mt-3 space-y-2">
        {step.evidenceLinks.map((l) => {
          const stub = EVIDENCE_STUBS.find((e) => e.id === l.evidenceId);
          return (
            <div
              key={l.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-annex-mint/30 bg-annex-mint/10 px-3 py-2 text-xs text-annex-mint"
              data-luix-frame="07-evidence-linked"
              data-figma-node="14:279"
            >
              <span>
                Preuve liée — {stub?.label ?? l.evidenceId}
              </span>
              <Link href="/app/evidence" className="text-annex-blue hover:underline">
                Voir
              </Link>
            </div>
          );
        })}
        <div className="flex justify-end">
          <span className="rounded-full border border-annex-mint/30 bg-annex-mint/15 px-3 py-1 text-xs font-semibold text-annex-mint">
            Fait
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      {/* Slot rempli */}
      {linked &&
        step.evidenceLinks.map((l) => {
          const stub = EVIDENCE_STUBS.find((e) => e.id === l.evidenceId);
          return (
            <div
              key={l.id}
              className="rounded-xl border border-annex-mint/40 border-t-2 bg-white/5 px-3 py-2"
            >
              <span className="rounded-full bg-annex-mint/20 px-2 py-0.5 text-[10px] font-semibold text-annex-mint">
                Liée
              </span>
              <p className="mt-1 text-sm text-white">{stub?.label ?? l.evidenceId}</p>
              <p className="text-[11px] text-[#CBD5E1]">{stub?.meta ?? l.evidenceId}</p>
            </div>
          );
        })}

      {/* Slot manquant requis — frame 07 */}
      {blocked && (
        <div className="rounded-xl border border-rose-500/40 border-t-2 border-dashed bg-rose-500/5 px-3 py-3">
          <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-semibold text-rose-300">
            Requis
          </span>
          <p className="mt-2 text-xs text-[#CBD5E1]">
            Aucune preuve liée. Liez depuis Evidence (stub ids).
          </p>
          <p className="mt-2 text-xs font-medium text-rose-300">
            Erreur Preuve requise — « Marquer fait » désactivé.
          </p>
        </div>
      )}

      {/* Soft warning optionnel */}
      {optionalWarn && (
        <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
          Avertissement · Preuve optionnelle — recommandé pour le dossier audit, non bloquant.
        </div>
      )}

      {blocked && (
        <p className="text-[11px] text-rose-300/90">
          Erreur requires_evidence=true — étape bloquée tant qu&apos;aucune preuve n&apos;est liée.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {(step.requiresEvidence || optionalWarn) && (
          <>
            <select
              className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-[#CBD5E1]"
              value={evidencePick}
              onChange={(e) => onPick(e.target.value)}
            >
              {EVIDENCE_STUBS.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.label} ({ev.id})
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={busy}
              onClick={onLink}
              className="rounded-full border border-white/15 px-3 py-1 text-xs text-[#CBD5E1] hover:bg-white/5"
            >
              Lier une preuve
            </button>
          </>
        )}
        <button
          type="button"
          disabled={busy || blocked}
          title={
            blocked
              ? 'Preuve manquante — liez une preuve pour activer « Marquer fait »'
              : undefined
          }
          onClick={onComplete}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            blocked
              ? 'cursor-not-allowed bg-white/10 text-slate-500'
              : 'bg-annex-deep hover:bg-blue-700'
          }`}
        >
          Marquer fait
        </button>
      </div>
    </div>
  );
}

export function IncidentsPanel({
  onSlaChange,
}: {
  onSlaChange?: (sla: IncidentSlaCountdown | null) => void;
}) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [sla, setSla] = useState<IncidentSlaCountdown[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [windowFilter, setWindowFilter] = useState<SlaWindow | 'all'>('24h');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [evidencePick, setEvidencePick] = useState<Record<string, string>>({});

  const refresh = useCallback(async () => {
    try {
      const [list, countdowns] = await Promise.all([
        listIncidents(DEFAULT_ORG),
        listIncidentSla(DEFAULT_ORG),
      ]);
      setIncidents(list);
      setSla(countdowns);
      const primary = countdowns[0] ?? null;
      onSlaChange?.(primary);
      setSelectedId((prev) => prev ?? list[0]?.id ?? null);
      setErr(null);
    } catch {
      setErr('API indisponible — démarrer apps/api.');
      onSlaChange?.(null);
    }
  }, [onSlaChange]);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 30000);
    return () => clearInterval(t);
  }, [refresh]);

  const selected = incidents.find((i) => i.id === selectedId) ?? null;
  const live = sla.find((s) => s.incidentId === selectedId) ?? sla[0] ?? null;

  const stepsFiltered = useMemo(() => {
    if (!selected) return [];
    const sorted = selected.steps.slice().sort((a, b) => a.sortOrder - b.sortOrder);
    if (windowFilter === 'all') return sorted;
    return sorted.filter((s) => s.window === windowFilter);
  }, [selected, windowFilter]);

  async function onLink(stepId: string) {
    if (!selected) return;
    const eid = evidencePick[stepId] ?? EVIDENCE_STUBS[0].id;
    setBusy(true);
    try {
      await linkStepEvidence(selected.id, stepId, eid);
      await refresh();
    } catch (e) {
      const body = (e as { body?: { message?: string } }).body;
      setErr(body?.message ?? (e instanceof Error ? e.message : 'Erreur liaison'));
    } finally {
      setBusy(false);
    }
  }

  async function onComplete(stepId: string) {
    if (!selected) return;
    const step = selected.steps.find((s) => s.id === stepId);
    if (step?.requiresEvidence && step.evidenceLinks.length === 0) {
      setErr('Preuve manquante — « Marquer fait » désactivé (requires_evidence).');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const eid = evidencePick[stepId];
      await completeStep(selected.id, stepId, eid ? [eid] : undefined);
      await refresh();
    } catch (e) {
      const body = (e as { body?: { message?: string | string[] } }).body;
      const msg = Array.isArray(body?.message) ? body?.message.join(', ') : body?.message;
      setErr(msg ?? 'Étape REJECTED — preuve requise.');
    } finally {
      setBusy(false);
    }
  }

  async function onClose() {
    if (!selected) return;
    setBusy(true);
    try {
      await closeIncident(selected.id);
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erreur clôture');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div data-luix-frame="05-playbook-incident" data-figma-node="14:167" className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">
            {selected ? 'Playbook incident · ANSSI FR' : 'Incidents'}
          </h1>
          <p className="mt-1 text-sm text-[#CBD5E1]">
            {selected
              ? `${selected.id} · ${selected.title} · timelines 24h / 72h / 1 mois`
              : 'Vue shell — bannière SLA lisible sur incident ouvert'}
          </p>
        </div>
        <Link
          href="/app/playbooks"
          className="rounded-full bg-annex-deep px-4 py-2 text-sm font-semibold hover:bg-blue-700"
        >
          Ouvrir depuis playbook
        </Link>
      </div>

      {live && selected?.status === 'open' && (
        <div className="lg:hidden">
          <SlaIncidentBanner variant="app" live={live} />
        </div>
      )}

      {err && (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-200">
          {err}
        </p>
      )}

      {incidents.length === 0 ? (
        <div className="card-glass rounded-2xl p-8 text-center">
          <p className="text-sm text-[#CBD5E1]">Aucun incident. Ouvrez-en un depuis Contrôles / Playbooks.</p>
          <Link
            href="/app/playbooks"
            className="mt-4 inline-block rounded-full border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/5"
          >
            Voir les templates ANSSI
          </Link>
        </div>
      ) : (
        <>
          {/* Frame 06 — cards grid */}
          <div className="grid gap-3 sm:grid-cols-3" data-luix-frame="06-incident-cards">
            {incidents.map((inc) => {
              const open = inc.status === 'open';
              return (
                <button
                  key={inc.id}
                  type="button"
                  onClick={() => setSelectedId(inc.id)}
                  className={`card-glass rounded-2xl p-4 text-left transition ${
                    selectedId === inc.id && open
                      ? 'ring-1 ring-rose-500/60'
                      : selectedId === inc.id
                        ? 'ring-1 ring-annex-blue/40'
                        : 'hover:bg-white/5'
                  }`}
                >
                  <p className="text-[11px] text-[#CBD5E1]">{inc.id}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{inc.title}</p>
                  <p className="mt-1 text-xs text-[#CBD5E1]">
                    {open
                      ? `Ouvert · ANSSI ${WINDOW_FR[live?.nextDeadline ?? '24h']}`
                      : 'Clôturé'}
                  </p>
                </button>
              );
            })}
          </div>

          {selected && (
            <div className="space-y-4">
              <div className="card-glass flex flex-wrap items-center justify-between gap-3 rounded-2xl p-5">
                <div>
                  <p className="text-sm font-semibold text-white">{selected.title}</p>
                  <p className="text-xs text-[#CBD5E1]">
                    Ouvert {new Date(selected.sla.openedAt).toLocaleString('fr-FR')} · 24h reste{' '}
                    {formatRemaining(new Date(selected.sla.due24hAt).getTime() - Date.now())}
                  </p>
                </div>
                {selected.status === 'open' && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void onClose()}
                    className="rounded-full border border-white/15 px-4 py-2 text-xs text-[#CBD5E1] hover:bg-white/5"
                  >
                    Clôturer (audit trail)
                  </button>
                )}
              </div>

              {/* Window tabs */}
              <div className="flex flex-wrap gap-2">
                {(['24h', '72h', '1m'] as SlaWindow[]).map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setWindowFilter(w)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      windowFilter === w
                        ? 'bg-annex-deep text-white'
                        : 'border border-white/15 text-[#CBD5E1] hover:bg-white/5'
                    }`}
                  >
                    {WINDOW_FR[w]}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setWindowFilter('all')}
                  className={`rounded-full px-3 py-1.5 text-xs ${
                    windowFilter === 'all'
                      ? 'bg-annex-deep text-white'
                      : 'border border-white/15 text-[#CBD5E1]'
                  }`}
                >
                  Toutes
                </button>
              </div>

              <p className="text-sm text-[#CBD5E1]">
                Checklist {windowFilter === 'all' ? 'ANSSI' : WINDOW_FR[windowFilter]} — détecter →
                qualifier → notifier.
              </p>

              <ol className="space-y-3">
                {stepsFiltered.map((step, idx) => (
                  <li
                    key={step.id}
                    className="card-glass rounded-2xl p-4"
                    data-luix-frame="incident-step"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex gap-3">
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            step.status === 'done'
                              ? 'bg-annex-mint/20 text-annex-mint'
                              : step.requiresEvidence && step.evidenceLinks.length === 0
                                ? 'bg-rose-500/20 text-rose-300'
                                : 'bg-annex-deep/40 text-annex-blue'
                          }`}
                        >
                          {step.status === 'done' ? '✓' : idx + 1}
                        </span>
                        <div>
                          <span className="text-[11px] font-semibold text-annex-mint">
                            {WINDOW_FR[step.window]}
                          </span>
                          <h3 className="text-sm font-medium text-white">{step.title}</h3>
                          <p className="mt-1 text-xs text-[#CBD5E1]">{step.description}</p>
                          <p className="mt-1 text-[11px] text-slate-500">
                            Owner · {step.ownerRole}
                            {step.requiresEvidence ? ' · preuve requise' : ' · preuve optionnelle'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {selected.status === 'open' && (
                      <StepEvidenceBlock
                        step={step}
                        busy={busy}
                        evidencePick={evidencePick[step.id] ?? EVIDENCE_STUBS[0].id}
                        onPick={(id) =>
                          setEvidencePick((p) => ({
                            ...p,
                            [step.id]: id,
                          }))
                        }
                        onLink={() => void onLink(step.id)}
                        onComplete={() => void onComplete(step.id)}
                      />
                    )}
                    {selected.status === 'closed' && step.status === 'done' && (
                      <StepEvidenceBlock
                        step={step}
                        busy
                        evidencePick=""
                        onPick={() => undefined}
                        onLink={() => undefined}
                        onComplete={() => undefined}
                      />
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </>
      )}
    </div>
  );
}
