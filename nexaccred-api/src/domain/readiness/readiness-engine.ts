import {
  Band,
  PILLARS,
  PillarWeights,
  ReadinessResult,
  ReadinessThresholds,
  SchemeReadinessSnapshot,
  UpcomingAssessment,
} from './types';

/**
 * THE READINESS ENGINE — ported 1:1 from nexaccred-react's
 * src/lib/readiness.js, the frontend prototype's original pure-function
 * implementation. Kept framework-free (no NestJS, no Prisma types) so it
 * stays trivially unit-testable, matching that file's own stated intent
 * ("no React, trivially unit-testable").
 *
 * Two steps, deliberately in this order:
 *   1. A weighted average of the 8 pillars produces a raw score and a raw band.
 *   2. Blocking rules can cap that band DOWNWARD only — never upward.
 *
 * Step 2 is the whole point. A weighted average alone would let a 90%-scoring
 * scheme read "Ready" while a critical impartiality gap sits open — exactly
 * the failure mode this product exists to prevent. Averages hide outliers;
 * blocking rules refuse to.
 *
 * Readiness is never persisted (Data Model §1.2) — callers recompute it from
 * a fresh snapshot every time, so it can never go stale silently.
 */

export const DEFAULT_WEIGHTS: PillarWeights = {
  Requirements: 20,
  Evidence: 15,
  Personnel: 10,
  Competence: 15,
  Operations: 10,
  Documentation: 10,
  Assurance: 10,
  CAPA: 10,
};

export const DEFAULT_THRESHOLDS: ReadinessThresholds = {
  ready: 90,
  risks: 75,
  notYetReady: 60,
};

const BAND_RANK: Record<Band, number> = { green: 3, yellow: 2, orange: 1, red: 0, draft: -1 };

export const BAND_LABEL: Record<Band, string> = {
  green: 'Ready',
  yellow: 'Ready with Risks',
  orange: 'Not Yet Ready',
  red: 'Not Ready',
  draft: 'Draft',
};

export function bandForScore(value: number, thresholds: ReadinessThresholds = DEFAULT_THRESHOLDS): Band {
  if (value >= thresholds.ready) return 'green';
  if (value >= thresholds.risks) return 'yellow';
  if (value >= thresholds.notYetReady) return 'orange';
  return 'red';
}

function daysUntil(date: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / msPerDay);
}

export function computeReadiness(
  snapshot: SchemeReadinessSnapshot,
  weights: PillarWeights = DEFAULT_WEIGHTS,
  thresholds: ReadinessThresholds = DEFAULT_THRESHOLDS,
): ReadinessResult {
  if (snapshot.lifecycleStatus === 'draft') {
    return { score: null, band: 'draft', rawScore: null, rawBand: 'draft', reasons: [] };
  }

  // --- Step 1: weighted raw score ---
  let raw = 0;
  let weightSum = 0;
  for (const pillar of PILLARS) {
    const w = weights[pillar] || 0;
    raw += (snapshot.pillarScores[pillar] || 0) * (w / 100);
    weightSum += w;
  }
  // Normalising keeps the result correct even if configured weights don't total 100.
  if (weightSum > 0) raw = raw * (100 / weightSum);
  raw = Math.round(raw);

  const rawBand = bandForScore(raw, thresholds);

  // --- Step 2: blocking rules (downward only) ---
  let band = rawBand;
  const reasons: string[] = [];
  const cap = (candidate: Band, why: string) => {
    if (BAND_RANK[candidate] < BAND_RANK[band]) {
      band = candidate;
      reasons.push(why);
    }
  };

  const critCount = snapshot.openCriticalFindingsCount;
  if (critCount >= 2) {
    cap('orange', `${critCount} unresolved critical gaps cap this scheme at "Not Yet Ready"`);
  } else if (critCount === 1) {
    cap('yellow', '1 unresolved critical gap caps this scheme at "Ready with Risks"');
  }

  const competenceScore = snapshot.pillarScores.Competence ?? 100;
  if (competenceScore < 60) {
    cap('orange', `Competence pillar at ${competenceScore}% is below the 60% floor, capping at "Not Yet Ready"`);
  }

  if (snapshot.witness && snapshot.nextAssessment) {
    const outstanding = snapshot.witness.required - snapshot.witness.completed;
    const daysToAssess = daysUntil(snapshot.nextAssessment.date);
    if (outstanding > 0 && daysToAssess >= 0 && daysToAssess < 30) {
      cap(
        'orange',
        `${outstanding} witness audit(s) still outstanding with only ${daysToAssess} days to the next AB visit`,
      );
    }
  }

  return { score: raw, band, rawScore: raw, rawBand, reasons };
}

/** Portfolio roll-up. Draft schemes are excluded — they have no meaningful score. */
export function computeOverallReadiness(
  snapshots: SchemeReadinessSnapshot[],
  weights: PillarWeights = DEFAULT_WEIGHTS,
  thresholds: ReadinessThresholds = DEFAULT_THRESHOLDS,
): { score: number; band: Band } {
  const active = snapshots.filter((s) => s.lifecycleStatus !== 'draft');
  if (!active.length) return { score: 0, band: 'red' };

  const total = active.reduce((sum, s) => sum + (computeReadiness(s, weights, thresholds).score ?? 0), 0);
  const score = Math.round(total / active.length);
  return { score, band: bandForScore(score, thresholds) };
}

/** Every scheme's next AB visit, nearest first. Drafts sort to the end. */
export function getUpcomingAssessments(
  snapshots: SchemeReadinessSnapshot[],
  weights: PillarWeights = DEFAULT_WEIGHTS,
  thresholds: ReadinessThresholds = DEFAULT_THRESHOLDS,
): UpcomingAssessment[] {
  return snapshots
    .map((s) => {
      const r = computeReadiness(s, weights, thresholds);
      return {
        schemeId: s.schemeId,
        schemeName: s.schemeName,
        band: r.band,
        score: r.score,
        assessmentType: s.nextAssessment?.type ?? null,
        date: s.nextAssessment?.date ?? null,
        daysUntil: s.nextAssessment ? daysUntil(s.nextAssessment.date) : Infinity,
      };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil);
}
