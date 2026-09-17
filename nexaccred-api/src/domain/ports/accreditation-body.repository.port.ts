export interface AccreditationBodySummary {
  id: string;
  shortName: string;
  fullName: string;
  country: string;
  accreditationNumber: string;
  accreditedSince: Date;
  status: string;
}

export interface CreateAccreditationBodyInput {
  shortName: string;
  fullName: string;
  country: string;
  accreditationNumber: string;
  accreditedSince: Date;
  status?: string;
}

export interface UpdateAccreditationBodyInput {
  shortName?: string;
  fullName?: string;
  country?: string;
  accreditationNumber?: string;
  accreditedSince?: Date;
  status?: string;
}

export const ACCREDITATION_BODY_REPOSITORY_PORT = Symbol('ACCREDITATION_BODY_REPOSITORY_PORT');

/**
 * Outbound port for the AccreditationBody bounded context (Data Model —
 * the CAB itself: KAN, UKAS, ANAB, etc.). Implemented by
 * infrastructure/persistence/prisma.
 *
 * No `delete` here by design: an AccreditationBody is referenced by Scheme
 * records, and this bounded context's scope (see modules/accreditation-body.module.ts)
 * intentionally exposes list/get/create/update only.
 */
export interface AccreditationBodyRepositoryPort {
  findAll(): Promise<AccreditationBodySummary[]>;
  findById(id: string): Promise<AccreditationBodySummary | null>;
  create(input: CreateAccreditationBodyInput): Promise<AccreditationBodySummary>;
  update(id: string, input: UpdateAccreditationBodyInput): Promise<AccreditationBodySummary>;
}
