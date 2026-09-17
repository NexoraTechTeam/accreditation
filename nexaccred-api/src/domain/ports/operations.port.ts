/**
 * Outbound port for Platform Audit's four operational domains (PRD FR-12.1,
 * Data Model §1.4). Unlike PersonnelCompetencyPort, no live Platform Audit
 * application exists yet — the only implementation today is
 * infrastructure/integrations/platform-audit/platform-audit-stub.gateway.ts,
 * returning realistic sample data. Swapping in a real HTTP adapter later
 * touches only that one file, never a use-case or controller, because
 * everything upstream depends on this interface.
 */

export interface WorkloadAggregate {
  schemeRef: string;
  schemeName: string;
  inReviewCount: number;
  totalCount: number;
}

export interface AuditExecutionRecord {
  externalAuditRef: string;
  schemeRef: string;
  clientName: string;
  auditType: string;
  scheduledDate: Date | null;
  completedDate: Date | null;
  result: string | null;
}

export interface TechnicalReviewItem {
  externalReviewRef: string;
  clientName: string;
  schemeRef: string;
  reviewerName: string;
  queuedSince: Date;
  status: string;
}

export interface CertificationDecisionRecord {
  externalDecisionRef: string;
  clientName: string;
  schemeRef: string;
  decision: string;
  decisionMaker: string;
  decidedAt: Date;
}

export const OPERATIONS_PORT = Symbol('OPERATIONS_PORT');

export interface OperationsPort {
  getCertificationActivityWorkload(): Promise<WorkloadAggregate[]>;
  getAuditExecutionRecords(schemeRef?: string): Promise<AuditExecutionRecord[]>;
  getTechnicalReviewQueue(): Promise<TechnicalReviewItem[]>;
  getCertificationDecisions(schemeRef?: string): Promise<CertificationDecisionRecord[]>;
}
