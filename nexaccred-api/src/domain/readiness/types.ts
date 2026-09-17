export const PILLARS = [
  'Requirements',
  'Evidence',
  'Personnel',
  'Competence',
  'Operations',
  'Documentation',
  'Assurance',
  'CAPA',
] as const;

export type Pillar = (typeof PILLARS)[number];

export type Band = 'green' | 'yellow' | 'orange' | 'red' | 'draft';

export type PillarWeights = Record<Pillar, number>;

export interface ReadinessThresholds {
  ready: number;
  risks: number;
  notYetReady: number;
}

/**
 * Everything the readiness engine needs about one scheme, already assembled
 * by the application layer from repositories/ports. Kept flat and primitive
 * so this module has zero framework or persistence dependency — see
 * readiness-engine.ts for why that matters.
 */
export interface SchemeReadinessSnapshot {
  schemeId: string;
  schemeName: string;
  lifecycleStatus: 'draft' | 'active' | 'suspended';
  pillarScores: Partial<Record<Pillar, number>>;
  openCriticalFindingsCount: number;
  witness?: { required: number; completed: number } | null;
  nextAssessment?: { type: string; date: Date } | null;
}

export interface ReadinessResult {
  score: number | null;
  band: Band;
  rawScore: number | null;
  rawBand: Band;
  reasons: string[];
}

export interface UpcomingAssessment {
  schemeId: string;
  schemeName: string;
  band: Band;
  score: number | null;
  assessmentType: string | null;
  date: Date | null;
  daysUntil: number;
}
