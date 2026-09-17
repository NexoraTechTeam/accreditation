export interface ComplianceRecordSummary {
  id: string;
  requirementId: string;
  schemeId: string;
  complianceStatus: string;
  lastAssessed: Date | null;
  assessedById: string | null;
}

export interface CreateComplianceRecordInput {
  requirementId: string;
  schemeId: string;
  complianceStatus: string;
  lastAssessed?: Date;
  assessedById?: string;
}

export const COMPLIANCE_RECORD_REPOSITORY_PORT = Symbol('COMPLIANCE_RECORD_REPOSITORY_PORT');

/**
 * Outbound port for the ComplianceRecord bounded context. List + create
 * only — matching the "readiness is never stored, always derived"
 * philosophy documented in domain/readiness/readiness-engine.ts: a
 * compliance status change is recorded as a brand-new ComplianceRecord
 * (with its own lastAssessed timestamp), never an in-place edit of history.
 * No update/delete here by design.
 */
export interface ComplianceRecordRepositoryPort {
  findAll(filter?: { schemeId?: string; requirementId?: string }): Promise<ComplianceRecordSummary[]>;
  create(input: CreateComplianceRecordInput): Promise<ComplianceRecordSummary>;
}
