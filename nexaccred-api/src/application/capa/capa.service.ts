import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CAPA_REPOSITORY_PORT,
  CAPA_STAGE_ORDER,
  CapaRepositoryPort,
  CapaStage,
  CapaSummary,
  CreateCapaData,
  UpdateCapaData,
} from '../../domain/ports/capa.repository.port';
import {
  AUDIT_TRAIL_REPOSITORY_PORT,
  AuditTrailRepositoryPort,
} from '../../domain/ports/audit-trail.repository.port';

/**
 * Application-layer use-cases for the Capa bounded context
 * (RBAC §1: FindingsCAPA domain).
 */
@Injectable()
export class CapaService {
  constructor(
    @Inject(CAPA_REPOSITORY_PORT) private readonly capas: CapaRepositoryPort,
    @Inject(AUDIT_TRAIL_REPOSITORY_PORT) private readonly auditTrail: AuditTrailRepositoryPort,
  ) {}

  listCapas(): Promise<CapaSummary[]> {
    return this.capas.findAll();
  }

  async getCapa(id: string): Promise<CapaSummary> {
    const capa = await this.capas.findById(id);
    if (!capa) {
      throw new NotFoundException(`Capa "${id}" not found`);
    }
    return capa;
  }

  async createCapa(data: CreateCapaData, actorUserId: string | null): Promise<CapaSummary> {
    const created = await this.capas.create(data);
    await this.auditTrail.record({
      userId: actorUserId,
      action: 'create',
      entityType: 'Capa',
      entityId: created.id,
      beforeAfter: { before: null, after: created },
    });
    return created;
  }

  async updateCapa(id: string, data: UpdateCapaData, actorUserId: string | null): Promise<CapaSummary> {
    const before = await this.getCapa(id);
    const after = await this.capas.update(id, data);
    await this.auditTrail.record({
      userId: actorUserId,
      action: 'update',
      entityType: 'Capa',
      entityId: id,
      beforeAfter: { before, after },
    });
    return after;
  }

  async deleteCapa(id: string, actorUserId: string | null): Promise<void> {
    const before = await this.getCapa(id);
    await this.capas.delete(id);
    await this.auditTrail.record({
      userId: actorUserId,
      action: 'delete',
      entityType: 'Capa',
      entityId: id,
      beforeAfter: { before, after: null },
    });
  }

  /**
   * Advances the CAPA stage. The workflow is linear by design (Data Model
   * §2 / prisma/schema.prisma CapaStage comment) — CAPA_STAGE_ORDER's
   * declaration order IS the only allowed direction of travel, so this
   * compares indices into that array and rejects anything that isn't a
   * strict step forward (a backward move, or "advancing" to the current
   * stage) with a 400. Reaching 'Closed' goes through this same endpoint at
   * Edit level; the higher-stakes "close a finding" action is separate (see
   * findings.service.ts#closeFinding, gated at Approve) — a CAPA reaching
   * its own terminal stage is routine casework, not a compliance judgement
   * call the way closing the originating finding is.
   */
  async advanceStage(id: string, newStage: CapaStage, actorUserId: string | null): Promise<CapaSummary> {
    const before = await this.getCapa(id);
    const currentIndex = CAPA_STAGE_ORDER.indexOf(before.stage);
    const newIndex = CAPA_STAGE_ORDER.indexOf(newStage);
    if (newIndex <= currentIndex) {
      throw new BadRequestException(
        `Cannot move Capa stage from "${before.stage}" to "${newStage}" — stage must advance forward only`,
      );
    }

    const data: UpdateCapaData = { stage: newStage };
    if (newStage === 'Closed') {
      data.closedDate = new Date();
    }

    const after = await this.capas.update(id, data);
    await this.auditTrail.record({
      userId: actorUserId,
      action: 'stage-change',
      entityType: 'Capa',
      entityId: id,
      beforeAfter: { before, after },
    });
    return after;
  }
}
