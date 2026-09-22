import { EvidenceCategory as PrismaEvidenceCategory } from '@prisma/client';

export type EvidenceCategory = PrismaEvidenceCategory;

export interface EvidenceSummary {
  id: string;
  complianceRecordId: string;
  evidenceCode: string;
  evidenceCategory: EvidenceCategory;
  evidenceStatus: string;
  validFrom: Date | null;
  validUntil: Date | null;
  approved: boolean;
  uploadedAt: Date;
}

export interface CreateEvidenceData {
  complianceRecordId: string;
  evidenceCode: string;
  evidenceCategory: EvidenceCategory;
  evidenceStatus: string;
  validFrom?: Date | null;
  validUntil?: Date | null;
  approved?: boolean;
}

export type UpdateEvidenceData = Partial<CreateEvidenceData>;

export const EVIDENCE_REPOSITORY_PORT = Symbol('EVIDENCE_REPOSITORY_PORT');

export interface EvidenceRepositoryPort {
  findAll(): Promise<EvidenceSummary[]>;
  findById(id: string): Promise<EvidenceSummary | null>;
  findByComplianceRecord(complianceRecordId: string): Promise<EvidenceSummary[]>;
  create(data: CreateEvidenceData): Promise<EvidenceSummary>;
  update(id: string, data: UpdateEvidenceData): Promise<EvidenceSummary>;
  delete(id: string): Promise<void>;
}
