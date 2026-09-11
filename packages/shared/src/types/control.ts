/** Contrôle NIS2 org — statut interne, jamais sur Trust public brut. */

export type ControlStatus =
  | 'not_started'
  | 'in_progress'
  | 'implemented'
  | 'not_applicable';

export interface Control {
  id: string;
  orgId: string;
  /** Code métier ex. NIS2-GOV-01 */
  code: string;
  domain: string;
  title: string;
  status: ControlStatus;
  owner?: string;
  dueAt?: string;
  updatedAt: string;
}
