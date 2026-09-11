/**
 * Mapping frames Figma Assessment + Playbooks (page 14:2)
 * + Trust editor (page 21:2)
 * → data-luix-frame / data-figma-node pour overlay LUIX.
 * Screenshots : /screenshots/assessment-playbooks/ + /screenshots/trust-editor/
 * File : https://www.figma.com/design/Azjl81f8lWazR4mbgOovSW
 */
export const FIGMA_ASSESSMENT_PLAYBOOKS_PAGE = '14:2' as const;
export const FIGMA_TRUST_EDITOR_PAGE = '21:2' as const;

export const FIGMA_OVERLAY_FRAMES = [
  { id: '01-assessment-empty', nodeId: '14:3', route: '/app/assessment', state: 'empty' },
  { id: '02-assessment-skeleton', nodeId: '14:44', route: '/app/assessment', state: 'loading' },
  { id: '03-assessment-resultat', nodeId: '14:85', route: '/app/assessment', state: 'result' },
  { id: '04-gap-detail', nodeId: '14:126', route: '/app/assessment', state: 'gap' },
  { id: '05-playbook-incident', nodeId: '14:167', route: '/app/incidents', state: 'active' },
  { id: '06-app-shell-sla', nodeId: '14:223', route: '/app/*', state: 'sla-banner' },
  { id: '07-evidence-linked', nodeId: '14:279', route: '/app/incidents', state: 'evidence' },
] as const;

export const FIGMA_TRUST_EDITOR_FRAMES = [
  {
    id: '01-trust-editor-brouillon',
    nodeId: '21:3',
    route: '/app/trust-editor',
    state: 'draft',
    screenshot: 'screenshots/trust-editor/01-trust-editor-brouillon.png',
  },
  {
    id: '02-preview-auth-draft',
    nodeId: '21:8',
    route: '/app/trust-editor/preview/[org]',
    state: 'preview-draft',
    screenshot: 'screenshots/trust-editor/02-preview-auth-draft.png',
  },
  {
    id: '03-modal-publish-toast',
    nodeId: '21:13',
    route: '/app/trust-editor',
    state: 'publish-modal',
    screenshot: 'screenshots/trust-editor/03-modal-publish-toast.png',
  },
  {
    id: '04-trust-org-public',
    nodeId: '21:18',
    route: '/trust/[org]',
    state: 'published',
    screenshot: 'screenshots/trust-editor/04-trust-org-public.png',
  },
  {
    id: '05-empty-profil-en-preparation',
    nodeId: '21:23',
    route: '/trust/[org]',
    state: 'empty',
    screenshot: 'screenshots/trust-editor/05-empty-profil-en-preparation.png',
  },
] as const;

export const FIGMA_TRUST_EDITOR_FILE =
  'https://www.figma.com/design/Azjl81f8lWazR4mbgOovSW?node-id=21-2' as const;
