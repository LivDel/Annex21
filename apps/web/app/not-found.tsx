import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center surface-void px-6 text-center">
      <p className="text-sm font-medium text-annex-mint">404</p>
      <h1 className="mt-2 text-2xl font-semibold">Page introuvable</h1>
      <Link href="/" className="mt-6 text-sm text-annex-blue hover:underline">
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
