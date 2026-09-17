import {
  bandForScore,
  computeOverallReadiness,
  computeReadiness,
  DEFAULT_THRESHOLDS,
  DEFAULT_WEIGHTS,
  getUpcomingAssessments,
} from './readiness-engine';
import { SchemeReadinessSnapshot } from './types';

function snapshot(overrides: Partial<SchemeReadinessSnapshot> = {}): SchemeReadinessSnapshot {
  return {
    schemeId: 'iso27001',
    schemeName: 'ISO 27001',
    lifecycleStatus: 'active',
    pillarScores: {
      Requirements: 90,
      Evidence: 90,
      Personnel: 90,
      Competence: 90,
      Operations: 90,
      Documentation: 90,
      Assurance: 90,
      CAPA: 90,
    },
    openCriticalFindingsCount: 0,
    witness: null,
    nextAssessment: null,
    ...overrides,
  };
}

describe('bandForScore', () => {
  it('maps scores to bands using the default thresholds', () => {
    expect(bandForScore(95)).toBe('green');
    expect(bandForScore(90)).toBe('green');
    expect(bandForScore(80)).toBe('yellow');
    expect(bandForScore(65)).toBe('orange');
    expect(bandForScore(40)).toBe('red');
  });
});

describe('computeReadiness', () => {
  it('returns a draft result untouched by scoring for draft schemes', () => {
    const result = computeReadiness(snapshot({ lifecycleStatus: 'draft' }));
    expect(result).toEqual({ score: null, band: 'draft', rawScore: null, rawBand: 'draft', reasons: [] });
  });

  it('computes a plain weighted average when nothing blocks it', () => {
    const result = computeReadiness(snapshot());
    expect(result.rawScore).toBe(90);
    expect(result.band).toBe('green');
    expect(result.reasons).toEqual([]);
  });

  it('normalises when configured weights do not sum to 100', () => {
    const halfWeights = Object.fromEntries(
      Object.entries(DEFAULT_WEIGHTS).map(([k, v]) => [k, v / 2]),
    ) as typeof DEFAULT_WEIGHTS;
    const full = computeReadiness(snapshot(), DEFAULT_WEIGHTS);
    const halved = computeReadiness(snapshot(), halfWeights);
    expect(halved.rawScore).toBe(full.rawScore);
  });

  it('never lets a blocking rule raise the band, only cap it downward', () => {
    // 2 pillars at 100 is already the best possible raw score (green); a
    // blocking rule firing must not somehow push it past green.
    const result = computeReadiness(
      snapshot({
        pillarScores: Object.fromEntries(
          Object.entries(DEFAULT_WEIGHTS).map(([k]) => [k, 100]),
        ),
        openCriticalFindingsCount: 0,
      }),
    );
    expect(result.band).toBe('green');
  });

  it('caps at "Ready with Risks" (yellow) for exactly one open critical finding', () => {
    const result = computeReadiness(snapshot({ openCriticalFindingsCount: 1 }));
    expect(result.rawBand).toBe('green');
    expect(result.band).toBe('yellow');
    expect(result.reasons[0]).toMatch(/1 unresolved critical gap/);
  });

  it('caps at "Not Yet Ready" (orange) for two or more open critical findings', () => {
    const result = computeReadiness(snapshot({ openCriticalFindingsCount: 2 }));
    expect(result.band).toBe('orange');
    expect(result.reasons[0]).toMatch(/2 unresolved critical gaps/);
  });

  it('caps at "Not Yet Ready" when Competence pillar is below the 60% floor, even if the average is high', () => {
    const result = computeReadiness(
      snapshot({
        pillarScores: { ...snapshot().pillarScores, Competence: 50 },
      }),
    );
    // A weighted average alone would still read fairly high — the floor must
    // override it regardless of the raw score. This is P4 from the PRD:
    // blocking rules over averages.
    expect(result.band).toBe('orange');
    expect(result.reasons.some((r) => r.includes('Competence pillar at 50%'))).toBe(true);
  });

  it('caps at "Not Yet Ready" when witness audits are outstanding within 30 days of the next AB visit', () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 10);
    const result = computeReadiness(
      snapshot({
        witness: { required: 4, completed: 2 },
        nextAssessment: { type: 'Surveillance', date: soon },
      }),
    );
    expect(result.band).toBe('orange');
    expect(result.reasons[0]).toMatch(/2 witness audit\(s\) still outstanding/);
  });

  it('does not cap for outstanding witnesses when the next AB visit is more than 30 days away', () => {
    const later = new Date();
    later.setDate(later.getDate() + 60);
    const result = computeReadiness(
      snapshot({
        witness: { required: 4, completed: 2 },
        nextAssessment: { type: 'Surveillance', date: later },
      }),
    );
    expect(result.band).toBe('green');
  });

  it('applies the most severe of multiple simultaneous blocking rules', () => {
    const result = computeReadiness(
      snapshot({
        openCriticalFindingsCount: 2, // would cap at orange
        pillarScores: { ...snapshot().pillarScores, Competence: 50 }, // would also cap at orange
      }),
    );
    expect(result.band).toBe('orange');
    expect(result.reasons.length).toBe(1); // second cap() call is a no-op once already at orange
  });
});

describe('computeOverallReadiness', () => {
  it('averages only active schemes, excluding drafts', () => {
    const result = computeOverallReadiness([
      snapshot({ schemeId: 'a', pillarScores: { ...snapshot().pillarScores, Requirements: 100 } }),
      snapshot({ schemeId: 'b', lifecycleStatus: 'draft' }),
    ]);
    expect(result.score).toBe(computeReadiness(snapshot({ pillarScores: { ...snapshot().pillarScores, Requirements: 100 } })).score);
  });

  it('returns a red 0 portfolio when there are no active schemes', () => {
    expect(computeOverallReadiness([snapshot({ lifecycleStatus: 'draft' })])).toEqual({ score: 0, band: 'red' });
  });
});

describe('getUpcomingAssessments', () => {
  it('sorts by days until the next assessment, nearest first, drafts (no date) last', () => {
    const near = new Date();
    near.setDate(near.getDate() + 5);
    const far = new Date();
    far.setDate(far.getDate() + 40);

    const result = getUpcomingAssessments([
      snapshot({ schemeId: 'far', nextAssessment: { type: 'Surveillance', date: far } }),
      snapshot({ schemeId: 'none' }),
      snapshot({ schemeId: 'near', nextAssessment: { type: 'Initial', date: near } }),
    ]);

    expect(result.map((r) => r.schemeId)).toEqual(['near', 'far', 'none']);
  });
});

describe('DEFAULT_THRESHOLDS', () => {
  it('matches the product-defined band cutoffs', () => {
    expect(DEFAULT_THRESHOLDS).toEqual({ ready: 90, risks: 75, notYetReady: 60 });
  });
});
