export interface DocumentRecord {
  id: string;
  name: string;
  docType: string;
  version: string;
  ownerUserId: string;
  lastReviewed: Date | null;
  status: string;
}

export interface CreateDocumentInput {
  name: string;
  docType: string;
  version: string;
  ownerUserId: string;
  lastReviewed?: Date | null;
  status?: string;
}

export interface UpdateDocumentInput {
  name?: string;
  docType?: string;
  version?: string;
  ownerUserId?: string;
  lastReviewed?: Date | null;
  status?: string;
}

export const DOCUMENT_REPOSITORY_PORT = Symbol('DOCUMENT_REPOSITORY_PORT');

/**
 * Outbound port for the Evidence domain's Document table (RBAC §1: "Evidence
 * covers Documents, Evidence Repository, Forms, Records, Required Document
 * Types"). Implemented by infrastructure/persistence/prisma, bound locally in
 * modules/documents.module.ts (see persistence.module.ts's note on new
 * feature modules binding their own ports).
 */
export interface DocumentRepositoryPort {
  findAll(): Promise<DocumentRecord[]>;
  findById(id: string): Promise<DocumentRecord | null>;
  create(input: CreateDocumentInput): Promise<DocumentRecord>;
  update(id: string, input: UpdateDocumentInput): Promise<DocumentRecord>;
  delete(id: string): Promise<void>;
}
