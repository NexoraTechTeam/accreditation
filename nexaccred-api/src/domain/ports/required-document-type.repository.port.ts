export interface RequiredDocumentTypeRecord {
  id: string;
  schemeId: string | null; // null = applies to all schemes
  typeName: string;
  fulfillmentStatus: string;
}

export interface CreateRequiredDocumentTypeInput {
  schemeId?: string | null;
  typeName: string;
  fulfillmentStatus?: string;
}

export interface UpdateRequiredDocumentTypeInput {
  schemeId?: string | null;
  typeName?: string;
  fulfillmentStatus?: string;
}

export const REQUIRED_DOCUMENT_TYPE_REPOSITORY_PORT = Symbol('REQUIRED_DOCUMENT_TYPE_REPOSITORY_PORT');

/**
 * Outbound port for the Evidence domain's RequiredDocumentType table (RBAC
 * §1). A null `schemeId` means "applies to all schemes" — see
 * prisma/schema.prisma's RequiredDocumentType model comment.
 */
export interface RequiredDocumentTypeRepositoryPort {
  findAll(): Promise<RequiredDocumentTypeRecord[]>;
  findById(id: string): Promise<RequiredDocumentTypeRecord | null>;
  create(input: CreateRequiredDocumentTypeInput): Promise<RequiredDocumentTypeRecord>;
  update(id: string, input: UpdateRequiredDocumentTypeInput): Promise<RequiredDocumentTypeRecord>;
  delete(id: string): Promise<void>;
}
