export type FindingClassification = 'MajorNC' | 'MinorNC' | 'Observation' | 'OFI';

export interface FindingSummary {
  id: string;
  findingCode: string;
  requirementId: string;
  schemeId: string;
  assessmentId: string | null;
  source: string;
  classification: FindingClassification;
  status: string;
  ownerUserId: string | null;
  dueDate: Date | null;
}

export interface CreateFindingData {
  findingCode: string;
  requirementId: string;
  schemeId: string;
  assessmentId?: string | null;
  source: string;
  classification: FindingClassification;
  status?: string;
  ownerUserId?: string | null;
  dueDate?: Date | null;
}

export type UpdateFindingData = Partial<CreateFindingData>;

export const FINDING_REPOSITORY_PORT = Symbol('FINDING_REPOSITORY_PORT');

/**
 * Outbound port for the Finding aggregate (RBAC §1: FindingsCAPA domain).
 * A finding is raised against a Requirement within a Scheme, optionally
 * traced back to the originating Assessment, and is the entry point of the
 * CAPA workflow — see capa.repository.port.ts for what happens downstream
 * once a finding exists.
 */
export interface FindingRepositoryPort {
  findAll(): Promise<FindingSummary[]>;
  findById(id: string): Promise<FindingSummary | null>;
  create(data: CreateFindingData): Promise<FindingSummary>;
  update(id: string, data: UpdateFindingData): Promise<FindingSummary>;
  delete(id: string): Promise<void>;
}
