import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateEvidenceData,
  EVIDENCE_REPOSITORY_PORT,
  EvidenceRepositoryPort,
  EvidenceSummary,
  UpdateEvidenceData,
} from '../../domain/ports/evidence.repository.port';
import {
  AUDIT_TRAIL_REPOSITORY_PORT,
  AuditTrailRepositoryPort,
} from '../../domain/ports/audit-trail.repository.port';

@Injectable()
export class EvidenceService {
  constructor(
    @Inject(EVIDENCE_REPOSITORY_PORT) private readonly evidence: EvidenceRepositoryPort,
    @Inject(AUDIT_TRAIL_REPOSITORY_PORT) private readonly auditTrail: AuditTrailRepositoryPort,
  ) {}

  listEvidence(): Promise<EvidenceSummary[]> {
    return this.evidence.findAll();
  }

  listByComplianceRecord(complianceRecordId: string): Promise<EvidenceSummary[]> {
    return this.evidence.findByComplianceRecord(complianceRecordId);
  }

  async getEvidence(id: string): Promise<EvidenceSummary> {
    const item = await this.evidence.findById(id);
    if (!item) {
      throw new NotFoundException(`Evidence "${id}" not found`);
    }
    return item;
  }

  async createEvidence(data: CreateEvidenceData, actorUserId: string | null): Promise<EvidenceSummary> {
    const created = await this.evidence.create(data);
    await this.auditTrail.record({
      userId: actorUserId,
      action: 'create',
      entityType: 'Evidence',
      entityId: created.id,
      beforeAfter: { before: null, after: created },
    });
    return created;
  }

  async updateEvidence(
    id: string,
    data: UpdateEvidenceData,
    actorUserId: string | null,
  ): Promise<EvidenceSummary> {
    const before = await this.getEvidence(id);
    const after = await this.evidence.update(id, data);
    await this.auditTrail.record({
      userId: actorUserId,
      action: 'update',
      entityType: 'Evidence',
      entityId: id,
      beforeAfter: { before, after },
    });
    return after;
  }

  async deleteEvidence(id: string, actorUserId: string | null): Promise<void> {
    const before = await this.getEvidence(id);
    await this.evidence.delete(id);
    await this.auditTrail.record({
      userId: actorUserId,
      action: 'delete',
      entityType: 'Evidence',
      entityId: id,
      beforeAfter: { before, after: null },
    });
  }
}
