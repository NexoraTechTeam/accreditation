import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateFindingData,
  FINDING_REPOSITORY_PORT,
  FindingRepositoryPort,
  FindingSummary,
  UpdateFindingData,
} from '../../domain/ports/finding.repository.port';
import {
  AUDIT_TRAIL_REPOSITORY_PORT,
  AuditTrailRepositoryPort,
} from '../../domain/ports/audit-trail.repository.port';

/**
 * Application-layer use-cases for the Finding bounded context
 * (RBAC §1: FindingsCAPA domain). Every state-changing use-case records an
 * AuditTrail entry with the actor, the before state, and the after state —
 * see audit-trail.repository.port.ts.
 */
@Injectable()
export class FindingsService {
  constructor(
    @Inject(FINDING_REPOSITORY_PORT) private readonly findings: FindingRepositoryPort,
    @Inject(AUDIT_TRAIL_REPOSITORY_PORT) private readonly auditTrail: AuditTrailRepositoryPort,
  ) {}

  listFindings(): Promise<FindingSummary[]> {
    return this.findings.findAll();
  }

  async getFinding(id: string): Promise<FindingSummary> {
    const finding = await this.findings.findById(id);
    if (!finding) {
      throw new NotFoundException(`Finding "${id}" not found`);
    }
    return finding;
  }

  async createFinding(data: CreateFindingData, actorUserId: string | null): Promise<FindingSummary> {
    const created = await this.findings.create(data);
    await this.auditTrail.record({
      userId: actorUserId,
      action: 'create',
      entityType: 'Finding',
      entityId: created.id,
      beforeAfter: { before: null, after: created },
    });
    return created;
  }

  async updateFinding(
    id: string,
    data: UpdateFindingData,
    actorUserId: string | null,
  ): Promise<FindingSummary> {
    const before = await this.getFinding(id);
    const after = await this.findings.update(id, data);
    await this.auditTrail.record({
      userId: actorUserId,
      action: 'update',
      entityType: 'Finding',
      entityId: id,
      beforeAfter: { before, after },
    });
    return after;
  }

  async deleteFinding(id: string, actorUserId: string | null): Promise<void> {
    const before = await this.getFinding(id);
    await this.findings.delete(id);
    await this.auditTrail.record({
      userId: actorUserId,
      action: 'delete',
      entityType: 'Finding',
      entityId: id,
      beforeAfter: { before, after: null },
    });
  }

  /**
   * Closing a finding is gated at Approve, not Edit, per the RBAC matrix's
   * Approve tier being reserved for Head-of-Accreditation-level decisions —
   * see interface/findings/findings.controller.ts. The service layer stays
   * agnostic of that distinction; it just performs the state change and
   * records it under its own 'close' action so the audit trail reads more
   * meaningfully than a generic 'update'.
   */
  async closeFinding(id: string, actorUserId: string | null): Promise<FindingSummary> {
    const before = await this.getFinding(id);
    const after = await this.findings.update(id, { status: 'Closed' });
    await this.auditTrail.record({
      userId: actorUserId,
      action: 'close',
      entityType: 'Finding',
      entityId: id,
      beforeAfter: { before, after },
    });
    return after;
  }
}
