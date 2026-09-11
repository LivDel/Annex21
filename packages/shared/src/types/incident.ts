/** Incidents + étapes + preuves liées — privé /app uniquement (RG-07/08). */

import type { SlaWindow } from './playbook';

export type IncidentStatus = 'open' | 'closed';
export type IncidentStepStatus = 'pending' | 'done' | 'skipped';

export interface IncidentStepEvidenceLink {
  id: string;
  incidentStepId: string;
  evidenceId: string;
  linkedAt: string;
  linkedBy?: string;
}

export interface IncidentStep {
  id: string;
  incidentId: string;
  templateStepId: string;
  sortOrder: number;
  window: SlaWindow;
  title: string;
  description: string;
  ownerRole: 'owner' | 'contributor';
  requiresEvidence: boolean;
  status: IncidentStepStatus;
  completedAt?: string;
  completedBy?: string;
  evidenceLinks: IncidentStepEvidenceLink[];
}

export interface IncidentSla {
  openedAt: string;
  due24hAt: string;
  due72hAt: string;
  due1mAt: string;
}

export interface Incident {
  id: string;
  orgId: string;
  playbookTemplateId: string;
  title: string;
  status: IncidentStatus;
  sla: IncidentSla;
  steps: IncidentStep[];
  closedAt?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

/** Vue countdown pour bannière UI */
export interface IncidentSlaCountdown {
  incidentId: string;
  title: string;
  remaining24hMs: number;
  remaining72hMs: number;
  remaining1mMs: number;
  nextDeadline: SlaWindow;
}
