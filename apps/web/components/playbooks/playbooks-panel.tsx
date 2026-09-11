'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PlaybookTemplate } from '@annex21/shared';
import { listPlaybookTemplates, openIncident } from '@/lib/app-api';

const WINDOW_FR: Record<string, string> = {
  '24h': '24h',
  '72h': '72h',
  '1m': '1 mois',
};

export function PlaybooksPanel() {
  const router = useRouter();
  const [templates, setTemplates] = useState<PlaybookTemplate[]>([]);
  const [title, setTitle] = useState('Incident cyber — notification ANSSI');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const list = await listPlaybookTemplates();
      setTemplates(list);
      setErr(null);
    } catch {
      setErr('API indisponible — démarrer apps/api.');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onOpen(templateId: string) {
    setBusy(true);
    setErr(null);
    try {
      const inc = await openIncident({
        playbookTemplateId: templateId,
        title: title.trim() || 'Incident ANSSI',
      });
      router.push('/app/incidents');
      // garder id en query serait nice; incidents sélectionne le plus récent
      void inc;
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erreur ouverture incident');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div data-luix-frame="playbooks" data-figma-node="14:167" className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Playbooks ANSSI</h1>
        <p className="mt-1 text-sm text-[#CBD5E1]">
          Templates immutables FR-ANSSI · timelines 24h / 72h / 1 mois (RG-04). DE BSI hors V1.
        </p>
      </div>

      {err && (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-200">
          {err}
        </p>
      )}

      <label className="card-glass block rounded-2xl p-4 text-sm">
        <span className="text-[#CBD5E1]">Titre de l&apos;incident à ouvrir</span>
        <input
          className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>

      {templates.length === 0 && !err && (
        <div className="card-glass h-32 animate-pulse rounded-2xl bg-white/5" />
      )}

      <div className="grid gap-4 lg:grid-cols-1">
        {templates.map((t) => (
          <article key={t.id} className="card-glass rounded-2xl p-5" data-luix-frame="playbook-template">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-annex-mint">
                  {t.body.authority} · {t.body.locale.toUpperCase()} · v{t.version}
                </span>
                <h2 className="mt-1 text-lg font-semibold text-white">{t.name}</h2>
                <p className="mt-1 text-sm text-[#CBD5E1]">{t.body.label}</p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => void onOpen(t.id)}
                className="rounded-full bg-annex-deep px-4 py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                Ouvrir un incident
              </button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {t.body.windows.map((w) => {
                const steps = t.body.steps.filter((s) => s.window === w);
                return (
                  <div key={w} className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <span className="text-xs font-semibold text-annex-mint">{WINDOW_FR[w]}</span>
                    <ul className="mt-2 space-y-2">
                      {steps.map((s) => (
                        <li key={s.id} className="text-xs text-[#CBD5E1]">
                          <span className="font-medium text-white">{s.title}</span>
                          {s.requiresEvidence && (
                            <span className="ml-1 text-amber-200/80">· preuve</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            <p className="mt-4 text-xs text-slate-500">
              Étape <code className="text-annex-mint">done</code> bloquée sans preuve minimale si
              exigée (RG-05). Template jsonb immutable — pas d&apos;édition in-place.
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
