import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateRequirementInput,
  REQUIREMENT_REPOSITORY_PORT,
  RequirementRepositoryPort,
  RequirementSummary,
  UpdateRequirementInput,
} from '../../domain/ports/requirement.repository.port';
import {
  AUDIT_TRAIL_REPOSITORY_PORT,
  AuditTrailRepositoryPort,
} from '../../domain/ports/audit-trail.repository.port';

/** Application-layer use-cases for the Requirement bounded context. */
@Injectable()
export class RequirementsService {
  constructor(
    @Inject(REQUIREMENT_REPOSITORY_PORT) private readonly requirements: RequirementRepositoryPort,
    @Inject(AUDIT_TRAIL_REPOSITORY_PORT) private readonly auditTrail: AuditTrailRepositoryPort,
  ) {}

  listRequirements(clauseId?: string): Promise<RequirementSummary[]> {
    return this.requirements.findAll({ clauseId });
  }

  async getRequirement(id: string): Promise<RequirementSummary> {
    const requirement = await this.requirements.findById(id);
    if (!requirement) {
      throw new NotFoundException(`Requirement "${id}" not found`);
    }
    return requirement;
  }

  async createRequirement(input: CreateRequirementInput, userId: string): Promise<RequirementSummary> {
    const created = await this.requirements.create(input);
    await this.auditTrail.record({
      userId,
      action: 'create',
      entityType: 'Requirement',
      entityId: created.id,
      beforeAfter: { before: null, after: created },
    });
    return created;
  }

  async updateRequirement(
    id: string,
    input: UpdateRequirementInput,
    userId: string,
  ): Promise<RequirementSummary> {
    const before = await this.getRequirement(id);
    const updated = await this.requirements.update(id, input);
    await this.auditTrail.record({
      userId,
      action: 'update',
      entityType: 'Requirement',
      entityId: id,
      beforeAfter: { before, after: updated },
    });
    return updated;
  }

  async deleteRequirement(id: string, userId: string): Promise<void> {
    const before = await this.getRequirement(id);
    await this.requirements.delete(id);
    await this.auditTrail.record({
      userId,
      action: 'delete',
      entityType: 'Requirement',
      entityId: id,
      beforeAfter: { before, after: null },
    });
  }
}
