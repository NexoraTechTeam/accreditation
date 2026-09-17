import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  ACCREDITATION_BODY_REPOSITORY_PORT,
  AccreditationBodyRepositoryPort,
  AccreditationBodySummary,
  CreateAccreditationBodyInput,
  UpdateAccreditationBodyInput,
} from '../../domain/ports/accreditation-body.repository.port';
import {
  AUDIT_TRAIL_REPOSITORY_PORT,
  AuditTrailRepositoryPort,
} from '../../domain/ports/audit-trail.repository.port';

/**
 * Application-layer use-cases for the AccreditationBody bounded context.
 * Controllers never touch the repository port directly — this is the only
 * place that also writes the audit trail (RBAC §5 / NFR "Auditability").
 */
@Injectable()
export class AccreditationBodyService {
  constructor(
    @Inject(ACCREDITATION_BODY_REPOSITORY_PORT)
    private readonly accreditationBodies: AccreditationBodyRepositoryPort,
    @Inject(AUDIT_TRAIL_REPOSITORY_PORT)
    private readonly auditTrail: AuditTrailRepositoryPort,
  ) {}

  listAccreditationBodies(): Promise<AccreditationBodySummary[]> {
    return this.accreditationBodies.findAll();
  }

  async getAccreditationBody(id: string): Promise<AccreditationBodySummary> {
    const body = await this.accreditationBodies.findById(id);
    if (!body) {
      throw new NotFoundException(`AccreditationBody "${id}" not found`);
    }
    return body;
  }

  async createAccreditationBody(
    input: CreateAccreditationBodyInput,
    userId: string,
  ): Promise<AccreditationBodySummary> {
    const created = await this.accreditationBodies.create(input);
    await this.auditTrail.record({
      userId,
      action: 'create',
      entityType: 'AccreditationBody',
      entityId: created.id,
      beforeAfter: { before: null, after: created },
    });
    return created;
  }

  async updateAccreditationBody(
    id: string,
    input: UpdateAccreditationBodyInput,
    userId: string,
  ): Promise<AccreditationBodySummary> {
    const before = await this.getAccreditationBody(id);
    const updated = await this.accreditationBodies.update(id, input);
    await this.auditTrail.record({
      userId,
      action: 'update',
      entityType: 'AccreditationBody',
      entityId: id,
      beforeAfter: { before, after: updated },
    });
    return updated;
  }
}
