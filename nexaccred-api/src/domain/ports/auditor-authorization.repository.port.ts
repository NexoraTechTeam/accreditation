export interface AuditorAuthorization {
  id: string;
  personnelRef: string;
  schemeId: string | null;
  standardRef: string;
  authorizationRole: 'LeadAuditor' | 'Auditor' | 'TechnicalExpert' | 'Witness';
  authorizedSince: Date;
  expiryDate: Date;
  status: 'Active' | 'Expired' | 'Suspended';
}

export const AUDITOR_AUTHORIZATION_REPOSITORY_PORT = Symbol('AUDITOR_AUTHORIZATION_REPOSITORY_PORT');

/**
 * NexAccred's own record of CAB-specific authorization/expiry — deliberately
 * separate from AIHCM (see domain/ports/personnel-competency.port.ts and
 * Data Model §2.7a). This port never talks to AIHCM; it only reads/writes
 * the local AuditorAuthorization table, keyed by AIHCM's employeeId as an
 * opaque personnelRef.
 */
export interface AuditorAuthorizationRepositoryPort {
  listForPersonnel(personnelRef: string): Promise<AuditorAuthorization[]>;
  listExpiringWithin(days: number): Promise<AuditorAuthorization[]>;
}
