export interface StandardSummary {
  id: string;
  name: string;
  type: string;
  issuer: string;
  description: string | null;
  status: string;
}

export interface ClauseSummary {
  id: string;
  clauseNumber: string;
  title: string;
}

export interface StandardVersionSummary {
  id: string;
  versionLabel: string;
  effectiveDate: Date;
  supersededDate: Date | null;
  clauses: ClauseSummary[];
}

export interface StandardDetail extends StandardSummary {
  versions: StandardVersionSummary[];
}

export interface CreateStandardInput {
  name: string;
  type: string;
  issuer: string;
  description?: string;
  status?: string;
}

export interface UpdateStandardInput {
  name?: string;
  type?: string;
  issuer?: string;
  description?: string;
  status?: string;
}

export const STANDARD_REPOSITORY_PORT = Symbol('STANDARD_REPOSITORY_PORT');

/**
 * Outbound port for the Standard bounded context. StandardVersion and
 * Clause are read-only children reachable only through `findById`'s nested
 * `versions[].clauses[]` — they have no CRUD surface of their own here.
 * Implemented by infrastructure/persistence/prisma.
 */
export interface StandardRepositoryPort {
  findAll(): Promise<StandardSummary[]>;
  findById(id: string): Promise<StandardDetail | null>;
  create(input: CreateStandardInput): Promise<StandardSummary>;
  update(id: string, input: UpdateStandardInput): Promise<StandardSummary>;
  delete(id: string): Promise<void>;
}
