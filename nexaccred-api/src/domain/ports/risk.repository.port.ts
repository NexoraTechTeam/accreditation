export interface RiskSummary {
  id: string;
  riskCode: string;
  category: string;
  description: string;
  schemeId: string | null;
  requirementId: string | null;
  likelihood: string;
  impact: string;
  status: string;
}

export interface CreateRiskData {
  riskCode: string;
  category: string;
  description: string;
  schemeId?: string | null;
  requirementId?: string | null;
  likelihood: string;
  impact: string;
  status?: string;
}

export type UpdateRiskData = Partial<CreateRiskData>;

export const RISK_REPOSITORY_PORT = Symbol('RISK_REPOSITORY_PORT');

/**
 * Outbound port for the Risk register (RBAC §1: FindingsCAPA domain). A risk
 * may optionally trace to a Scheme and/or a Requirement, but neither is
 * mandatory — the register also carries risks that don't map to either
 * (e.g. general operational or competence risks).
 */
export interface RiskRepositoryPort {
  findAll(): Promise<RiskSummary[]>;
  findById(id: string): Promise<RiskSummary | null>;
  create(data: CreateRiskData): Promise<RiskSummary>;
  update(id: string, data: UpdateRiskData): Promise<RiskSummary>;
  delete(id: string): Promise<void>;
}
