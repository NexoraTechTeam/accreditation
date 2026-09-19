/**
 * Readiness Widget — source-grounded answer engine (widget/core: generic,
 * dependency-free, no per-app import). Every app builds its own engine from
 * its own rules; the MATCHING SEMANTICS live here once so two apps can never
 * drift into answering the same question by different rules
 * (docs/ai-assistant-widget-rollout-plan.md Fase 3).
 *
 * Tokenized matcher (Fase 2a — accreditation commit dcb8aee's own keyword fix
 * left substring traps behind: 'r1' matched inside "Q1", 'p1' inside "grup1",
 * 'kan' inside longer words, because it tested with String.includes on raw
 * text). Every keyword — single word or phrase — is reduced to its own token
 * sequence and matched as a WHOLE, space-padded run of tokens, so a keyword
 * can never fire from inside an unrelated word.
 *
 * idf-lite: a keyword unique to one rule is stronger evidence than one shared
 * across rules (the old matcher let array order alone settle ties). MIN_SCORE
 * stops a single throwaway short keyword from counting as a confident answer
 * — the old threshold was effectively 1.
 *
 * Guardrails every host inherits (PRD FR-10 for accreditation, the 16 Prinsip
 * Kunci for academy): answer only from approved sources; no approved source ->
 * CLARIFICATION_NEEDED plus a nudge to record a finding; never present an
 * assumption as an approved requirement; never approve, never assign blame,
 * never make a compliance decision.
 */
export const MIN_SCORE = 2;

export function tokenize(text) {
  return ((text || '').toLowerCase().match(/[a-z0-9]+/g)) || [];
}

export function canonicalPhrase(text) {
  return tokenize(text).join(' ');
}

/**
 * Doc frequency is computed PER POOL, never across manual+generated combined:
 * a generated rule reusing a common word (a nav label, a persona name) would
 * otherwise dilute the idf bonus of the manual rule that legitimately owns
 * that word, weakening manual answers for a reason no reviewer could see.
 */
export function buildDocFreq(rules) {
  const df = new Map();
  for (const rule of rules) {
    const seenInThisRule = new Set();
    for (const kw of rule.match) {
      const phrase = canonicalPhrase(kw);
      if (!phrase || seenInThisRule.has(phrase)) continue;
      seenInThisRule.add(phrase);
      df.set(phrase, (df.get(phrase) || 0) + 1);
    }
  }
  return df;
}

export function ruleLabel(rule) {
  return rule.id.replace(/^gen-/, '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function scoreRule(questionTokens, rule, docFreq) {
  const padded = ` ${questionTokens.join(' ')} `;
  let score = 0;
  for (const kw of rule.match) {
    const kwTokens = tokenize(kw);
    if (kwTokens.length === 0) continue;
    const phrase = kwTokens.join(' ');
    const isPhrase = kwTokens.length > 1;
    // A short single word (<=4 chars, where every substring trap lived —
    // 'r1'/'p1'/'ai'/'kan') must match a WHOLE token. A longer single word may
    // still match embedded in a token, so Indonesian affixes ("dihapus",
    // "menghapus") keep matching their root ("hapus") the way the old
    // substring matcher did by accident — only the short, trap-prone keywords
    // need the strict boundary.
    const hit = (!isPhrase && phrase.length > 4)
      ? padded.includes(phrase)
      : padded.includes(` ${phrase} `);
    if (!hit) continue;
    const base = isPhrase ? 3 : (phrase.length > 4 ? 2 : 1);
    const df = docFreq.get(phrase) || 1;
    score += base + (df === 1 ? 1 : 0); // idf-lite: bonus only when unique to this rule
  }
  return score;
}

function rank(questionTokens, rules, docFreq) {
  return rules
    .map((rule) => ({ rule, score: scoreRule(questionTokens, rule, docFreq) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
}

/**
 * Build an app's answerQuestion(question, ctx) -> {answer, sources, classification}.
 * The return SHAPE is the contract every shell (React and vanilla) depends on
 * and must not change.
 *
 *   manualRules     hand-written, always wins
 *   generatedRules  code/doc-derived, consulted only when manual falls short
 *   sources         { KEY: 'human readable citation' }
 *   notFound(candidates) -> string   app's own honest "no approved source" copy
 */
export function createAnswerEngine({ manualRules, generatedRules = [], sources, notFound }) {
  const manualDf = buildDocFreq(manualRules);
  const generatedDf = buildDocFreq(generatedRules);

  return function answerQuestion(question, ctx = {}) {
    const questionTokens = tokenize(question);

    const manualScored = rank(questionTokens, manualRules, manualDf);
    const manualBest = manualScored[0];
    if (manualBest && manualBest.score >= MIN_SCORE) {
      return {
        answer: manualBest.rule.answer(ctx),
        sources: manualBest.rule.sources.map((s) => sources[s]),
        classification: manualBest.rule.classification,
      };
    }

    const generatedScored = rank(questionTokens, generatedRules, generatedDf);
    const generatedBest = generatedScored[0];
    if (generatedBest && generatedBest.score >= MIN_SCORE) {
      return {
        answer: generatedBest.rule.answer(ctx),
        sources: generatedBest.rule.sources.map((s) => sources[s]),
        classification: generatedBest.rule.classification,
      };
    }

    // Below threshold: offer the closest topics instead of a bare "I don't
    // know", but still classify it honestly as needing clarification.
    const seen = new Set();
    const candidates = [];
    for (const s of [...manualScored, ...generatedScored]) {
      if (seen.has(s.rule.id)) continue;
      seen.add(s.rule.id);
      candidates.push(ruleLabel(s.rule));
      if (candidates.length === 3) break;
    }

    return {
      answer: notFound(candidates),
      sources: [],
      classification: 'CLARIFICATION_NEEDED',
    };
  };
}
