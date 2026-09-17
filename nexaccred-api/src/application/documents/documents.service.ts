import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateDocumentInput,
  DOCUMENT_REPOSITORY_PORT,
  DocumentRecord,
  DocumentRepositoryPort,
  UpdateDocumentInput,
} from '../../domain/ports/document.repository.port';
import {
  AUDIT_TRAIL_REPOSITORY_PORT,
  AuditTrailRepositoryPort,
} from '../../domain/ports/audit-trail.repository.port';

/**
 * Application-layer use-cases for the Document bounded context (Evidence
 * domain, RBAC §1). Every create/update is audit-trailed with before/after
 * (RBAC §5, generalized by audit-trail.repository.port.ts's own doc comment
 * to every state-changing action, not just permission changes).
 */
@Injectable()
export class DocumentsService {
  constructor(
    @Inject(DOCUMENT_REPOSITORY_PORT) private readonly documents: DocumentRepositoryPort,
    @Inject(AUDIT_TRAIL_REPOSITORY_PORT) private readonly auditTrail: AuditTrailRepositoryPort,
  ) {}

  list(): Promise<DocumentRecord[]> {
    return this.documents.findAll();
  }

  async get(id: string): Promise<DocumentRecord> {
    const doc = await this.documents.findById(id);
    if (!doc) {
      throw new NotFoundException(`Document "${id}" not found`);
    }
    return doc;
  }

  async create(input: CreateDocumentInput, actingUserId: string): Promise<DocumentRecord> {
    const created = await this.documents.create(input);
    await this.auditTrail.record({
      userId: actingUserId,
      action: 'create',
      entityType: 'Document',
      entityId: created.id,
      beforeAfter: { before: null, after: created },
    });
    return created;
  }

  async update(id: string, input: UpdateDocumentInput, actingUserId: string): Promise<DocumentRecord> {
    const before = await this.get(id);
    const after = await this.documents.update(id, input);
    await this.auditTrail.record({
      userId: actingUserId,
      action: 'update',
      entityType: 'Document',
      entityId: id,
      beforeAfter: { before, after },
    });
    return after;
  }

  async remove(id: string, actingUserId: string): Promise<void> {
    const before = await this.get(id);
    await this.documents.delete(id);
    await this.auditTrail.record({
      userId: actingUserId,
      action: 'delete',
      entityType: 'Document',
      entityId: id,
      beforeAfter: { before, after: null },
    });
  }
}
