import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateRiskData,
  RISK_REPOSITORY_PORT,
  RiskRepositoryPort,
  RiskSummary,
  UpdateRiskData,
} from '../../domain/ports/risk.repository.port';
import {
  AUDIT_TRAIL_REPOSITORY_PORT,
  AuditTrailRepositoryPort,
} from '../../domain/ports/audit-trail.repository.port';

/**
 * Application-layer use-cases for the Risk register bounded context
 * (RBAC §1: FindingsCAPA domain).
 */
@Injectable()
export class RiskService {
  constructor(
    @Inject(RISK_REPOSITORY_PORT) private readonly risks: RiskRepositoryPort,
    @Inject(AUDIT_TRAIL_REPOSITORY_PORT) private readonly auditTrail: AuditTrailRepositoryPort,
  ) {}

  listRisks(): Promise<RiskSummary[]> {
    return this.risks.findAll();
  }

  async getRisk(id: string): Promise<RiskSummary> {
    const risk = await this.risks.findById(id);
    if (!risk) {
      throw new NotFoundException(`Risk "${id}" not found`);
    }
    return risk;
  }

  async createRisk(data: CreateRiskData, actorUserId: string | null): Promise<RiskSummary> {
    const created = await this.risks.create(data);
    await this.auditTrail.record({
      userId: actorUserId,
      action: 'create',
      entityType: 'Risk',
      entityId: created.id,
      beforeAfter: { before: null, after: created },
    });
    return created;
  }

  async updateRisk(id: string, data: UpdateRiskData, actorUserId: string | null): Promise<RiskSummary> {
    const before = await this.getRisk(id);
    const after = await this.risks.update(id, data);
    await this.auditTrail.record({
      userId: actorUserId,
      action: 'update',
      entityType: 'Risk',
      entityId: id,
      beforeAfter: { before, after },
    });
    return after;
  }

  async deleteRisk(id: string, actorUserId: string | null): Promise<void> {
    const before = await this.getRisk(id);
    await this.risks.delete(id);
    await this.auditTrail.record({
      userId: actorUserId,
      action: 'delete',
      entityType: 'Risk',
      entityId: id,
      beforeAfter: { before, after: null },
    });
  }
}
