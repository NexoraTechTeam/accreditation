/**
 * Outbound port for the Personnel Competency domain (Data Model §1.4-1.5).
 *
 * This is the seam that makes AIHCM swappable in principle, even though in
 * practice AIHCM is the one real external system NexAccred integrates with
 * today (infrastructure/integrations/aihcm/aihcm-http.gateway.ts). The
 * domain and application layers depend on this interface only — never on
 * AIHCM's DTOs, its JWT auth flow, or its base URL. See ADR-style rationale
 * in the AIHCM gateway file itself.
 *
 * Types here are NexAccred's own vocabulary, not AIHCM's. The adapter is
 * responsible for translating AIHCM's `EmployeeProfileView` /
 * `EmployeeCompetency` DTOs into these shapes — that translation is exactly
 * what keeps a future AIHCM contract change from rippling into use-cases.
 */

export type CompetencyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

export interface PersonnelProfile {
  /** Opaque external identifier — AIHCM's employeeId. Never a local FK. */
  personnelRef: string;
  fullName: string;
  employeeNumber: string;
  jobTitle: string | null;
  orgUnitName: string | null;
  status: string;
}

export interface CompetencyRecord {
  competencyId: string;
  competencyCode: string;
  competencyName: string;
  level: CompetencyLevel;
  selfAssessed: boolean;
  assessedAt: Date;
}

export const PERSONNEL_COMPETENCY_PORT = Symbol('PERSONNEL_COMPETENCY_PORT');

export interface PersonnelCompetencyPort {
  /** Returns null rather than throwing when the person doesn't exist upstream. */
  getPersonnelProfile(personnelRef: string): Promise<PersonnelProfile | null>;

  /**
   * Current competency levels only — AIHCM does not keep assessment history
   * (Data Model §1.5). Does not include CAB-specific authorization/expiry;
   * that is NexAccred's own AuditorAuthorization record, not part of this port.
   */
  listCompetencies(personnelRef: string): Promise<CompetencyRecord[]>;
}
