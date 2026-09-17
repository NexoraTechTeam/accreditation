export interface AuditTrailEntry {
  userId: string | null;
  action: string; // "create" | "update" | "delete" | free-text for domain-specific actions
  entityType: string; // e.g. "Finding", "ReadinessConfig"
  entityId: string | null;
  beforeAfter?: { before: unknown; after: unknown } | null;
}

export interface AuditTrailRecord extends AuditTrailEntry {
  id: string;
  occurredAt: Date;
}

export const AUDIT_TRAIL_REPOSITORY_PORT = Symbol('AUDIT_TRAIL_REPOSITORY_PORT');

/**
 * RBAC §5: "every permission change is written to the immutable audit trail
 * with actor, timestamp, before/after" — generalized here to every
 * state-changing action (PRD NFR "Auditability"), not just permission
 * changes. Every CRUD service's create/update/delete should call `record()`
 * with the entity's state before and after the change.
 */
export interface AuditTrailRepositoryPort {
  record(entry: AuditTrailEntry): Promise<void>;
  list(filter?: { entityType?: string; userId?: string; limit?: number }): Promise<AuditTrailRecord[]>;
}
