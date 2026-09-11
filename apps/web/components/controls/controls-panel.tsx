'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { Control } from '@annex21/shared';
import { DEFAULT_ORG, listControls, updateControl } from '@/lib/app-api';

const STATUS_FR: Record<Control['status'], string> = {
  not_started: 'Non démarré',
  in_progress: 'En cours',
  implemented: 'Implémenté',
  not_applicable: 'N/A',
};

export function ControlsPanel({ focusId }: { focusId?: string }) {
  const [controls, setControls] = useState<Control[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const list = await listControls(DEFAULT_ORG);
      setControls(list);
      setErr(null);
    } catch {
      setErr('API indisponible — démarrer apps/api (stub auth).');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onStatus(id: string, status: Control['status']) {
    setBusyId(id);
    try {
      const updated = await updateControl(id, { status });
      setControls((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erreur mise à jour');
    } finally {
      setBusyId(null);
    }
  }

  async function onOwner(id: string, owner: string) {
    setBusyId(id);
    try {
      const updated = await updateControl(id, { owner });
      setControls((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erreur owner');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div data-luix-frame="controls-list" className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Contrôles NIS2</h1>
          <p className="mt-1 text-sm text-[#CBD5E1]">
            Statuts opérationnels org · distincts des playbooks incidents ANSSI
          </p>
        </div>
        <Link
          href="/app/playbooks"
          className="rounded-full border border-white/15 px-4 py-2 text-sm text-[#CBD5E1] hover:bg-white/5"
        >
          Playbooks incidents →
        </Link>
      </div>

      {err && (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-200">
          {err}
        </p>
      )}

      <section className="card-glass rounded-2xl">
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
          <p className="text-sm font-medium text-white">
            {controls.length} contrôle{controls.length > 1 ? 's' : ''}
          </p>
          <span className="text-[11px] text-[#CBD5E1]">PATCH /controls/:id</span>
        </div>
        <ul className="divide-y divide-white/5">
          {controls.length === 0 && !err && (
            <li className="space-y-3 px-5 py-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded-xl bg-white/5" />
              ))}
            </li>
          )}
          {controls.map((c) => {
            const focused = focusId === c.id;
            return (
              <li
                key={c.id}
                id={c.id}
                className={`flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 ${
                  focused ? 'bg-annex-deep/25 ring-1 ring-inset ring-annex-blue/40' : ''
                }`}
              >
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/app/controls/${c.id}`}
                    className="text-sm font-medium text-white hover:text-annex-blue"
                  >
                    <span className="text-xs text-annex-mint">{c.code}</span> {c.title}
                  </Link>
                  <p className="text-xs text-[#CBD5E1]">
                    {c.domain}
                    {c.owner ? ` · ${c.owner}` : ' · owner non assigné'}
                    {c.dueAt ? ` · échéance ${c.dueAt.slice(0, 10)}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    className="w-28 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-[#CBD5E1]"
                    placeholder="Owner"
                    defaultValue={c.owner ?? ''}
                    disabled={busyId === c.id}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v !== (c.owner ?? '')) void onOwner(c.id, v);
                    }}
                  />
                  <select
                    className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-[#CBD5E1]"
                    value={c.status}
                    disabled={busyId === c.id}
                    onChange={(e) =>
                      void onStatus(c.id, e.target.value as Control['status'])
                    }
                  >
                    {(Object.keys(STATUS_FR) as Control['status'][]).map((s) => (
                      <option key={s} value={s}>
                        {STATUS_FR[s]}
                      </option>
                    ))}
                  </select>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
