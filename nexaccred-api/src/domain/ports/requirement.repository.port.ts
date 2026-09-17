import { RequirementType } from '@prisma/client';

export interface RequirementSummary {
  id: string;
  refCode: string;
  clauseId: string;
  requirementText: string;
  requirementType: RequirementType;
  mandatory: boolean;
  effectiveDate: Date;
  expiryDate: Date | null;
}

export interface CreateRequirementInput {
  refCode: string;
  clauseId: string;
  requirementText: string;
  requirementType: RequirementType;
  mandatory?: boolean;
  effectiveDate: Date;
  expiryDate?: Date;
}

export interface UpdateRequirementInput {
  refCode?: string;
  clauseId?: string;
  requirementText?: string;
  requirementType?: RequirementType;
  mandatory?: boolean;
  effectiveDate?: Date;
  expiryDate?: Date | null;
}

export const REQUIREMENT_REPOSITORY_PORT = Symbol('REQUIREMENT_REPOSITORY_PORT');

/**
 * Outbound port for the Requirement bounded context (Data Model —
 * Requirement is the atomic unit of a Standard's Clause). Implemented by
 * infrastructure/persistence/prisma.
 */
export interface RequirementRepositoryPort {
  findAll(filter?: { clauseId?: string }): Promise<RequirementSummary[]>;
  findById(id: string): Promise<RequirementSummary | null>;
  create(input: CreateRequirementInput): Promise<RequirementSummary>;
  update(id: string, input: UpdateRequirementInput): Promise<RequirementSummary>;
  delete(id: string): Promise<void>;
}
