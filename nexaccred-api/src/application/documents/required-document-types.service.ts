import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateRequiredDocumentTypeInput,
  REQUIRED_DOCUMENT_TYPE_REPOSITORY_PORT,
  RequiredDocumentTypeRecord,
  RequiredDocumentTypeRepositoryPort,
  UpdateRequiredDocumentTypeInput,
} from '../../domain/ports/required-document-type.repository.port';
import {
  AUDIT_TRAIL_REPOSITORY_PORT,
  AuditTrailRepositoryPort,
} from '../../domain/ports/audit-trail.repository.port';

/** Application-layer use-cases for RequiredDocumentType (Evidence domain, RBAC §1). */
@Injectable()
export class RequiredDocumentTypesService {
  constructor(
    @Inject(REQUIRED_DOCUMENT_TYPE_REPOSITORY_PORT)
    private readonly requiredDocumentTypes: RequiredDocumentTypeRepositoryPort,
    @Inject(AUDIT_TRAIL_REPOSITORY_PORT) private readonly auditTrail: AuditTrailRepositoryPort,
  ) {}

  list(): Promise<RequiredDocumentTypeRecord[]> {
    return this.requiredDocumentTypes.findAll();
  }

  async get(id: string): Promise<RequiredDocumentTypeRecord> {
    const type = await this.requiredDocumentTypes.findById(id);
    if (!type) {
      throw new NotFoundException(`RequiredDocumentType "${id}" not found`);
    }
    return type;
  }

  async create(
    input: CreateRequiredDocumentTypeInput,
    actingUserId: string,
  ): Promise<RequiredDocumentTypeRecord> {
    const created = await this.requiredDocumentTypes.create(input);
    await this.auditTrail.record({
      userId: actingUserId,
      action: 'create',
      entityType: 'RequiredDocumentType',
      entityId: created.id,
      beforeAfter: { before: null, after: created },
    });
    return created;
  }

  async update(
    id: string,
    input: UpdateRequiredDocumentTypeInput,
    actingUserId: string,
  ): Promise<RequiredDocumentTypeRecord> {
    const before = await this.get(id);
    const after = await this.requiredDocumentTypes.update(id, input);
    await this.auditTrail.record({
      userId: actingUserId,
      action: 'update',
      entityType: 'RequiredDocumentType',
      entityId: id,
      beforeAfter: { before, after },
    });
    return after;
  }

  async remove(id: string, actingUserId: string): Promise<void> {
    const before = await this.get(id);
    await this.requiredDocumentTypes.delete(id);
    await this.auditTrail.record({
      userId: actingUserId,
      action: 'delete',
      entityType: 'RequiredDocumentType',
      entityId: id,
      beforeAfter: { before, after: null },
    });
  }
}
