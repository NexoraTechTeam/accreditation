/**
 * Ordered CAPA workflow stages — declaration order IS the forward-progress
 * order the application layer enforces (see application/capa/capa.service.ts
 * `advanceStage`). Do not reorder without updating that logic.
 */
export const CAPA_STAGE_ORDER = [
  'Correction',
  'RootCause',
  'CorrectiveAction',
  'Verification',
  'Effectiveness',
  'Closed',
] as const;

export type CapaStage = (typeof CAPA_STAGE_ORDER)[number];

export interface CapaSummary {
  id: string;
  capaCode: string;
  findingId: string;
  stage: CapaStage;
  ownerUserId: string | null;
  dueDate: Date | null;
  closedDate: Date | null;
}

export interface CreateCapaData {
  capaCode: string;
  findingId: string;
  stage?: CapaStage;
  ownerUserId?: string | null;
  dueDate?: Date | null;
  closedDate?: Date | null;
}

export type UpdateCapaData = Partial<CreateCapaData>;

export const CAPA_REPOSITORY_PORT = Symbol('CAPA_REPOSITORY_PORT');

/**
 * Outbound port for the Capa aggregate (RBAC §1: FindingsCAPA domain). Each
 * Capa traces back to exactly one Finding and walks a fixed linear stage
 * workflow (Correction → RootCause → CorrectiveAction → Verification →
 * Effectiveness → Closed) — see CAPA_STAGE_ORDER above.
 */
export interface CapaRepositoryPort {
  findAll(): Promise<CapaSummary[]>;
  findById(id: string): Promise<CapaSummary | null>;
  create(data: CreateCapaData): Promise<CapaSummary>;
  update(id: string, data: UpdateCapaData): Promise<CapaSummary>;
  delete(id: string): Promise<void>;
}
