'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { Control } from '@annex21/shared';
import { getControl, updateControl } from '@/lib/app-api';

const STATUS_FR: Record<Control['status'], string> = {
  not_started: 'Non démarré',
  in_progress: 'En cours',
  implemented: 'Implémenté',
  not_applicable: 'N/A',
};

export function ControlDetailPanel({ id }: { id: string }) {
  const [control, setControl] = useState<Control | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const row = await getControl(id);
      setControl(row);
      setErr(null);
    } catch {
      setErr('Contrôle introuvable ou API indisponible.');
    }
  }, [id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function patch(partial: {
    status?: Control['status'];
    owner?: string;
    dueAt?: string;
  }) {
    setBusy(true);
    try {
      const updated = await updateControl(id, partial);
      setControl(updated);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erreur maj');
    } finally {
      setBusy(false);
    }
  }

  if (err && !control) {
    return (
      <div className="card-glass rounded-2xl p-6">
        <p className="text-sm text-rose-300">{err}</p>
        <Link href="/app/controls" className="mt-4 inline-block text-sm text-annex-blue hover:underline">
          ← Retour contrôles
        </Link>
      </div>
    );
  }

  if (!control) {
    return (
      <div className="card-glass h-40 animate-pulse rounded-2xl bg-white/5" />
    );
  }

  return (
    <div data-luix-frame="control-detail" className="space-y-6">
      <Link href="/app/controls" className="text-xs text-annex-blue hover:underline">
        ← Tous les contrôles
      </Link>
      <div>
        <p className="text-xs text-annex-mint">{control.code}</p>
        <h1 className="text-2xl font-semibold text-white">{control.title}</h1>
        <p className="mt-1 text-sm text-[#CBD5E1]">{control.domain}</p>
      </div>

      <section className="card-glass grid gap-4 rounded-2xl p-5 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-[#CBD5E1]">Statut</span>
          <select
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white"
            value={control.status}
            disabled={busy}
            onChange={(e) =>
              void patch({ status: e.target.value as Control['status'] })
            }
          >
            {(Object.keys(STATUS_FR) as Control['status'][]).map((s) => (
              <option key={s} value={s}>
                {STATUS_FR[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-[#CBD5E1]">Owner</span>
          <input
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white"
            defaultValue={control.owner ?? ''}
            disabled={busy}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v !== (control.owner ?? '')) void patch({ owner: v });
            }}
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="text-[#CBD5E1]">Échéance (ISO date)</span>
          <input
            type="date"
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white"
            defaultValue={control.dueAt?.slice(0, 10) ?? ''}
            disabled={busy}
            onChange={(e) => {
              const v = e.target.value;
              void patch({
                dueAt: v ? new Date(`${v}T00:00:00.000Z`).toISOString() : '',
              });
            }}
          />
        </label>
      </section>

      {err && <p className="text-xs text-rose-300">{err}</p>}
      <p className="text-xs text-[#CBD5E1]">
        Mis à jour {control.updatedAt.slice(0, 19).replace('T', ' ')} UTC
      </p>
    </div>
  );
}
