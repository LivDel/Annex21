import Link from 'next/link';

export default function TrustNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center surface-void px-6 text-center">
      <p className="text-sm font-medium text-annex-mint">Trust Center</p>
      <h1 className="mt-2 text-2xl font-semibold">Organisation introuvable</h1>
      <p className="mt-2 max-w-md text-sm text-slate-400">
        Aucun Trust Center publié pour ce slug. Les brouillons ne sont pas exposés par
        l&apos;API publique (RG-07).
      </p>
      <Link href="/" className="mt-6 text-sm text-annex-blue hover:underline">
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
