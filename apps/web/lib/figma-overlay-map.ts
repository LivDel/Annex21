/**
 * Mapping frames Figma Assessment + Playbooks (page 14:2)
 * → data-luix-frame / data-figma-node pour overlay LUIX.
 * Screenshots : /screenshots/assessment-playbooks/
 * File : https://www.figma.com/design/Azjl81f8lWazR4mbgOovSW
 */
export const FIGMA_ASSESSMENT_PLAYBOOKS_PAGE = '14:2' as const;

export const FIGMA_OVERLAY_FRAMES = [
  { id: '01-assessment-empty', nodeId: '14:3', route: '/app/assessment', state: 'empty' },
  { id: '02-assessment-skeleton', nodeId: '14:44', route: '/app/assessment', state: 'loading' },
  { id: '03-assessment-resultat', nodeId: '14:85', route: '/app/assessment', state: 'result' },
  { id: '04-gap-detail', nodeId: '14:126', route: '/app/assessment', state: 'gap' },
  { id: '05-playbook-incident', nodeId: '14:167', route: '/app/incidents', state: 'active' },
  { id: '06-app-shell-sla', nodeId: '14:223', route: '/app/*', state: 'sla-banner' },
  { id: '07-evidence-linked', nodeId: '14:279', route: '/app/incidents', state: 'evidence' },
] as const;
