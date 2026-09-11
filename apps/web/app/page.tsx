import Link from 'next/link';
import { Logo } from '@/components/logo';
import { SlaIncidentBanner } from '@/components/sla-banner';

export default function LandingPage() {
  return (
    <div className="surface-void min-h-screen text-slate-100">
      <SlaIncidentBanner variant="marketing" />

      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
          <a href="#produit" className="hover:text-white">
            Produit
          </a>
          <a href="#nis2" className="hover:text-white">
            NIS2
          </a>
          <Link href="/trust/acme" className="hover:text-white">
            Trust Center
          </Link>
          <a href="#tarifs" className="hover:text-white">
            Tarifs
          </a>
        </nav>
        <Link
          href="/app/assessment"
          className="rounded-full border border-annex-mint/40 bg-transparent px-4 py-1.5 text-sm font-medium text-annex-mint hover:bg-annex-mint/10"
        >
          Lancer l&apos;assessment
        </Link>
      </header>

      <section className="hero-glow relative mx-auto max-w-6xl px-6 pb-24 pt-16">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
          <span className="h-1.5 w-1.5 rounded-full bg-annex-mint" />
          SaaS mid-market · 100% digital · data in-EU
        </div>
        <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-white md:text-6xl">
          NIS2 natif, data in-EU, playbooks ANSSI
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-slate-400">
          Clarifiez votre Betroffenheit en 15 minutes — avant tout paywall. Conformité
          opérationnelle pour les entreprises européennes concernées.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/app/assessment"
            className="rounded-full bg-aurora-cta px-5 py-2.5 text-sm font-semibold text-white shadow-aurora hover:opacity-95"
          >
            Lancer l&apos;assessment (15 min)
          </Link>
          <Link
            href="/trust/acme"
            className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/10"
          >
            Voir le Trust Center
          </Link>
        </div>
        <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-annex-mint" />
            Hébergement UE
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-annex-mint" />
            Playbooks ANSSI
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-annex-mint" />
            Sans friction paywall
          </li>
        </ul>
      </section>

      <section id="produit" className="mx-auto max-w-6xl px-6 pb-24">
        <p className="text-sm font-medium text-annex-mint">Betroffenheit avant paywall</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">
          Savoir si vous êtes concerné — puis agir
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <ValueCard
            badge="Gratuit"
            title="Êtes-vous concerné ?"
            body="Secteur, taille, criticité — le questionnaire Betroffenheit classe votre entité (essentielle / importante) sans engagement."
          />
          <ValueCard
            badge="15 min"
            title="Gaps NIS2 identifiés"
            body="Cartographie des contrôles manquants, priorisés par risque et échéances réglementaires (24h / 72h / 1 mois)."
          />
          <ValueCard
            badge="Opérationnel"
            title="Playbooks ANSSI"
            body="Réponses d'incident prêtes à l'emploi, alignées ANSSI — sans exposer de preuves brutes aux tiers."
          />
        </div>
      </section>

      <section id="nis2" className="mx-auto max-w-6xl px-6 pb-24">
        <div className="card-glass rounded-2xl p-8 md:p-10">
          <h2 className="text-2xl font-semibold">Différenciant V1</h2>
          <ul className="mt-6 grid gap-4 text-sm text-slate-300 md:grid-cols-2">
            <li>NIS2-first — pas un clone SOC 2 américain avec NIS2 en add-on.</li>
            <li>Playbooks nationaux FR (ANSSI) : timelines 24h / 72h / 1 mois.</li>
            <li>Trust Center acheteurs, FR / EN / DE — draft ≠ public.</li>
            <li>Data in-EU : Postgres, Redis, MinIO, backups et logs sensibles.</li>
          </ul>
          <p className="mt-6 text-xs text-slate-500">
            Hors V1 : DORA / finance, TPRM profond, white-label MSP. Aucun claim DORA dans
            cette interface.
          </p>
        </div>
      </section>

      <section id="tarifs" className="mx-auto max-w-6xl px-6 pb-24">
        <h2 className="text-2xl font-semibold">Tarifs indicatifs</h2>
        <p className="mt-2 text-slate-400">ACV 10–30 k€ / an · onboarding 5–15 k€.</p>
        <Link
          href="/app/assessment"
          className="mt-6 inline-block rounded-full bg-annex-deep px-5 py-2.5 text-sm font-semibold"
        >
          Commencer l&apos;assessment
        </Link>
      </section>

      <footer className="border-t border-white/10 px-6 py-8 text-center text-xs text-slate-500">
        Annex21 · data in-EU · RG-10 résidence UE · preuves jamais exposées au Trust public
      </footer>
    </div>
  );
}

function ValueCard({
  badge,
  title,
  body,
}: {
  badge: string;
  title: string;
  body: string;
}) {
  return (
    <article className="card-glass rounded-2xl p-6">
      <span className="inline-flex rounded-full border border-annex-blue/30 bg-annex-blue/10 px-2 py-0.5 text-[11px] font-medium text-annex-blue">
        {badge}
      </span>
      <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{body}</p>
    </article>
  );
}
