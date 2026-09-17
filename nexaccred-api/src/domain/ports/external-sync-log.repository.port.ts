export type ExternalSystemCode = 'PLATFORM_AUDIT' | 'AIHCM';
export type ExternalSyncDomain =
  | 'Lifecycle'
  | 'AuditExecution'
  | 'TechnicalReview'
  | 'CertificationDecision'
  | 'PersonnelCompetency';
export type ExternalSyncStatus = 'Success' | 'Partial' | 'Failed';

export interface ExternalSyncLogEntry {
  systemCode: ExternalSystemCode;
  domain: ExternalSyncDomain;
  lastSyncedAt: Date;
  recordsSynced: number;
  status: ExternalSyncStatus;
  errorMessage: string | null;
}

export const EXTERNAL_SYNC_LOG_REPOSITORY_PORT = Symbol('EXTERNAL_SYNC_LOG_REPOSITORY_PORT');

/**
 * Powers FR-12.2 ("screens sourced from either system are clearly marked
 * with which system, sync status, and last-sync time"). One record() call
 * per adapter invocation keeps that badge honest without NexAccred ever
 * storing the underlying Platform Audit / AIHCM records themselves — only
 * the fact and outcome of having fetched them (FR-12.4, "never duplicates").
 */
export interface ExternalSyncLogRepositoryPort {
  record(entry: Omit<ExternalSyncLogEntry, 'lastSyncedAt'>): Promise<void>;
  getLatest(systemCode: ExternalSystemCode, domain: ExternalSyncDomain): Promise<ExternalSyncLogEntry | null>;
  getLatestForAllDomains(): Promise<ExternalSyncLogEntry[]>;
}
