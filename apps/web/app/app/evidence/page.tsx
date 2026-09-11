import { AppShell } from '@/components/app-shell';

export const metadata = { title: 'Evidence' };

const ROWS = [
  { file: 'politique-ssi-2026.pdf', provenance: 'manuel', control: 'Gouvernance' },
  { file: 'idp-mfa-export.json', provenance: 'connecteur', control: 'Réponse incidents' },
];

export default function EvidencePage() {
  return (
    <AppShell active="/app/evidence">
      <h1 className="text-2xl font-semibold">Evidence</h1>
      <p className="mt-1 text-sm text-slate-400">
        Bibliothèque privée. Ces fichiers ne sont <strong className="text-slate-200">jamais</strong>{' '}
        exposés sur le Trust Center public (RG-08). Stockage MinIO in-EU (RG-10).
      </p>

      <div className="card-glass mt-8 overflow-hidden rounded-2xl">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3">Fichier</th>
              <th className="px-5 py-3">Provenance</th>
              <th className="px-5 py-3">Contrôle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {ROWS.map((r) => (
              <tr key={r.file}>
                <td className="px-5 py-3 font-medium text-white">{r.file}</td>
                <td className="px-5 py-3 text-slate-400">{r.provenance}</td>
                <td className="px-5 py-3 text-slate-400">{r.control}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
