/**
 * Wire types for AIHCM's actual API, confirmed by reading its backend source
 * directly (08 - AIHCM/backend/src/main/java/com/product/hcm), not assumed.
 * These stay private to this adapter — nothing outside
 * infrastructure/integrations/aihcm should import from this file; the rest
 * of the app depends on domain/ports/personnel-competency.port.ts instead.
 */

export interface AihcmLoginRequest {
  tenantCode: string;
  email: string;
  password: string;
}

// POST /api/v1/auth/login response — AuthController.LoginResponse
export interface AihcmLoginResponse {
  accessToken: string;
  expiresInMinutes: number;
  userId: string;
  tenantId: string;
  email: string;
}

// GET /api/v1/employees/{employeeId} — EmployeeProfileView
// Note: no email field on this view (email lives with the Person/identity
// record, not exposed here per the AIHCM source).
export interface AihcmEmployeeProfileView {
  employeeId: string;
  employeeNumber: string;
  fullName: string;
  status: string;
  joinDate: string;
  positionName: string | null;
  jobLevelCode: string | null;
  orgUnitName: string | null;
  managerEmployeeId: string | null;
}

// GET /api/v1/competencies/employees/{employeeId} — EmployeeCompetency[]
// No expiry field, no verification-status beyond selfAssessed — see
// domain/ports/personnel-competency.port.ts for why NexAccred layers its own
// AuditorAuthorization on top instead of expecting AIHCM to carry it.
export interface AihcmEmployeeCompetency {
  id: string;
  employeeId: string;
  competencyId: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  selfAssessed: boolean;
  assessedByUserId: string | null;
  assessedAt: string;
}

// GET /api/v1/competencies — Competency[] (catalog)
export interface AihcmCompetency {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
}
