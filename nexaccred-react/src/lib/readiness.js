import { PILLARS } from '../data/schemes';
import { daysUntil } from './format';

/**
 * THE READINESS ENGINE
 *
 * Two steps, deliberately in this order:
 *
 *   1. A weighted average of the 8 pillars produces a raw score and a raw band.
 *   2. Blocking rules can cap that band DOWNWARD only — never upward.
 *
 * Step 2 is the whole point. A weighted average alone would let a 90%-scoring scheme
 * read "Ready" while a critical impartiality gap sits open, which is exactly the failure
 * mode this product exists to prevent. Averages hide outliers; blocking rules refuse to.
 *
 * Weights and thresholds are configuration, not code (design principle P1) — the
 * Readiness Methodology screen edits them live and every scheme recalculates.
 */

export const DEFAULT_WEIGHTS = {
  Requirements: 20,
  Evidence: 15,
  Personnel: 10,
  Competence: 15,
  Operations: 10,
  Documentation: 10,
  Assurance: 10,
  CAPA: 10,
};

export const DEFAULT_THRESHOLDS = { ready: 90, risks: 75, notYetReady: 60 };

export const BAND_RANK = { green: 3, yellow: 2, orange: 1, red: 0 };

export const BAND_LABEL = {
  green: 'Ready',
  yellow: 'Ready with Risks',
  orange: 'Not Yet Ready',
  red: 'Not Ready',
};

export const BAND_TEXT = {
  green: 'text-status-green',
  yellow: 'text-status-yellow',
  orange: 'text-status-orange',
  red: 'text-status-red',
};

export function bandForScore(v, thresholds = DEFAULT_THRESHOLDS) {
  if (v >= thresholds.ready) return 'green';
  if (v >= thresholds.risks) return 'yellow';
  if (v >= thresholds.notYetReady) return 'orange';
  return 'red';
}

/** Bar/fill colour for a 0-100 score, matching the band palette. */
export function barColor(v) {
  if (v >= 90) return '#059669';
  if (v >= 75) return '#B45309';
  if (v >= 60) return '#C2410C';
  return '#DC2626';
}

/**
 * Compute readiness for a single scheme.
 * Returns { score, band, rawScore, rawBand, reasons[] } — `reasons` explains any cap,
 * so the UI can always answer "why this band and not the raw one?"
 */
export function computeReadiness(schemeKey, schemes, weights = DEFAULT_WEIGHTS, thresholds = DEFAULT_THRESHOLDS) {
  const s = schemes[schemeKey];
  if (!s || s.badge === 'draft') {
    return { score: null, band: 'draft', rawScore: null, rawBand: 'draft', reasons: [] };
  }

  // --- Step 1: weighted raw score ---
  let raw = 0;
  let weightSum = 0;
  PILLARS.forEach((p) => {
    const w = weights[p] || 0;
    raw += (s.pillars[p] || 0) * (w / 100);
    weightSum += w;
  });
  // Normalising keeps the result correct even if configured weights don't total 100.
  if (weightSum > 0) raw = raw * (100 / weightSum);
  raw = Math.round(raw);

  const rawBand = bandForScore(raw, thresholds);

  // --- Step 2: blocking rules (downward only) ---
  let band = rawBand;
  const reasons = [];
  const cap = (b, why) => {
    if (BAND_RANK[b] < BAND_RANK[band]) {
      band = b;
      reasons.push(why);
    }
  };

  const critCount = s.tabs.critical.length;
  if (critCount >= 2) {
    cap('orange', `${critCount} unresolved critical gaps cap this scheme at "Not Yet Ready"`);
  } else if (critCount === 1) {
    cap('yellow', '1 unresolved critical gap caps this scheme at "Ready with Risks"');
  }

  if (s.pillars.Competence < 60) {
    cap('orange', `Competence pillar at ${s.pillars.Competence}% is below the 60% floor, capping at "Not Yet Ready"`);
  }

  if (s.witness && s.nextAssessment) {
    const outstanding = s.witness.required - s.witness.completed;
    const daysToAssess = daysUntil(s.nextAssessment.date);
    if (outstanding > 0 && daysToAssess >= 0 && daysToAssess < 30) {
      cap('orange', `${outstanding} witness audit(s) still outstanding with only ${daysToAssess} days to the next AB visit`);
    }
  }

  return { score: raw, band, rawScore: raw, rawBand, reasons };
}

/** Portfolio roll-up. Draft schemes are excluded — they have no meaningful score. */
export function computeOverallReadiness(schemes, schemeOrder, weights, thresholds) {
  const active = schemeOrder.filter((k) => schemes[k].badge !== 'draft');
  if (!active.length) return { score: 0, band: 'red' };
  const total = active.reduce(
    (a, k) => a + computeReadiness(k, schemes, weights, thresholds).score,
    0
  );
  const score = Math.round(total / active.length);
  return { score, band: bandForScore(score, thresholds) };
}

/** Every scheme's next AB visit, nearest first. Drafts sort to the end. */
export function getUpcomingAssessments(schemes, schemeOrder, weights, thresholds) {
  return schemeOrder
    .map((k) => {
      const s = schemes[k];
      const na = s.nextAssessment;
      const r = computeReadiness(k, schemes, weights, thresholds);
      return {
        key: k,
        name: s.name,
        ab: s.ab,
        badge: r.band,
        score: r.score,
        type: na ? na.type : null,
        date: na ? na.date : null,
        days: na ? daysUntil(na.date) : Infinity,
      };
    })
    .sort((a, b) => a.days - b.days);
}
