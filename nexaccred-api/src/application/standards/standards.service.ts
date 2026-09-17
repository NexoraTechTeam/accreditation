import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateStandardInput,
  STANDARD_REPOSITORY_PORT,
  StandardDetail,
  StandardRepositoryPort,
  StandardSummary,
  UpdateStandardInput,
} from '../../domain/ports/standard.repository.port';
import {
  AUDIT_TRAIL_REPOSITORY_PORT,
  AuditTrailRepositoryPort,
} from '../../domain/ports/audit-trail.repository.port';

/**
 * Application-layer use-cases for the Standard bounded context. StandardVersion
 * and Clause are exposed only as read-only nested data under `getStandard` —
 * they have no use-cases of their own here (RBAC §1 / route spec).
 */
@Injectable()
export class StandardsService {
  constructor(
    @Inject(STANDARD_REPOSITORY_PORT) private readonly standards: StandardRepositoryPort,
    @Inject(AUDIT_TRAIL_REPOSITORY_PORT) private readonly auditTrail: AuditTrailRepositoryPort,
  ) {}

  listStandards(): Promise<StandardSummary[]> {
    return this.standards.findAll();
  }

  async getStandard(id: string): Promise<StandardDetail> {
    const standard = await this.standards.findById(id);
    if (!standard) {
      throw new NotFoundException(`Standard "${id}" not found`);
    }
    return standard;
  }

  async createStandard(input: CreateStandardInput, userId: string): Promise<StandardSummary> {
    const created = await this.standards.create(input);
    await this.auditTrail.record({
      userId,
      action: 'create',
      entityType: 'Standard',
      entityId: created.id,
      beforeAfter: { before: null, after: created },
    });
    return created;
  }

  async updateStandard(id: string, input: UpdateStandardInput, userId: string): Promise<StandardSummary> {
    const before = await this.getStandard(id);
    const updated = await this.standards.update(id, input);
    await this.auditTrail.record({
      userId,
      action: 'update',
      entityType: 'Standard',
      entityId: id,
      beforeAfter: { before, after: updated },
    });
    return updated;
  }

  async deleteStandard(id: string, userId: string): Promise<void> {
    const before = await this.getStandard(id);
    await this.standards.delete(id);
    await this.auditTrail.record({
      userId,
      action: 'delete',
      entityType: 'Standard',
      entityId: id,
      beforeAfter: { before, after: null },
    });
  }
}
