/** Playbook templates FR-ANSSI — jsonb immutable versionné. */

export type PlaybookAuthority = 'ANSSI';
export type PlaybookLocale = 'fr';
export type SlaWindow = '24h' | '72h' | '1m';

export interface PlaybookTemplateStep {
  id: string;
  sortOrder: number;
  window: SlaWindow;
  title: string;
  description: string;
  ownerRole: 'owner' | 'contributor';
  requiresEvidence: boolean;
}

/**
 * Contenu immutable du template (stocké en jsonb).
 * Ne pas muter en place — nouvelle version = nouvelle row.
 */
export interface PlaybookTemplateBody {
  authority: PlaybookAuthority;
  locale: PlaybookLocale;
  label: string;
  windows: SlaWindow[];
  steps: PlaybookTemplateStep[];
}

export interface PlaybookTemplate {
  id: string;
  version: string;
  name: string;
  /** jsonb immutable FR-ANSSI */
  body: PlaybookTemplateBody;
  createdAt: string;
}
