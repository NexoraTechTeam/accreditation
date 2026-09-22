import { SchemeReadinessSnapshot } from '../readiness/types';

export interface SchemeSummary {
  id: string;
  name: string;
  fullName: string;
  conformityType: string;
  lifecycleStatus: 'draft' | 'active' | 'suspended';
  accreditationBodyId: string;
  clientCount: number;
}

export interface CreateSchemeData {
  name: string;
  fullName: string;
  conformityType: string;
  accreditationBodyId: string;
  lifecycleStatus?: 'draft' | 'active' | 'suspended';
  clientCount?: number;
}

export type UpdateSchemeData = Partial<CreateSchemeData>;

export const SCHEME_REPOSITORY_PORT = Symbol('SCHEME_REPOSITORY_PORT');

/**
 * Outbound port for local, NexAccred-owned scheme data (never for Platform
 * Audit or AIHCM data — see operations.port.ts / personnel-competency.port.ts
 * for those). Implemented by infrastructure/persistence/prisma.
 */
export interface SchemeRepositoryPort {
  findAll(): Promise<SchemeSummary[]>;
  findById(schemeId: string): Promise<SchemeSummary | null>;
  create(data: CreateSchemeData): Promise<SchemeSummary>;
  update(schemeId: string, data: UpdateSchemeData): Promise<SchemeSummary>;
  delete(schemeId: string): Promise<void>;

  /**
   * Assembles everything the readiness engine needs for one scheme — pillar
   * scores, open critical finding count, witness cycle state, next
   * assessment — as one flat snapshot. This is where the relational schema
   * (SchemePillarScore, Finding, WitnessCycle, Assessment) meets the pure
   * domain/readiness engine's input contract.
   */
  getReadinessSnapshot(schemeId: string): Promise<SchemeReadinessSnapshot | null>;
  getAllReadinessSnapshots(): Promise<SchemeReadinessSnapshot[]>;
}
