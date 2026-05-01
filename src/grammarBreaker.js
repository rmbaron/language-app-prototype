// Grammar Breaker — sentence-level circuit breaker.
//
// Bottom-up micro-pattern validator. Companion to the word-level breaker
// (circuitCheck.js). Required for two-way chat at-level: rejects sentences
// that contain features above the learner's active atom set.
//
// Architecture:
//   1. Tokenize text → tokens with surface, position, atoms, formType
//   2. Run each registered pattern's detector → list of fired matches
//   3. For each fired pattern, evaluate license against activeAtoms
//   4. Sentence is allowed iff every fired pattern is licensed
//
// The validator never matches a sentence to a template — it only inspects
// which features are present. Tiers don't constrain sentences; patterns do,
// and tiers control which patterns are licensed when.

import { resolveSystemFormWithType } from './formsMap'
import { getResolvedWord } from './wordRegistry'
import { ALWAYS_PASS_WORDS } from './circuitCheck'
import { PATTERNS } from './grammarBreakerPatterns'
import { isPatternEnabled } from './grammarBreakerConfig'

// ── Function-word table (built once from ALWAYS_PASS_WORDS) ─────────────────
// Each entry maps the surface word to its full atom list (primary + umbrellas).
// Mirrors how L2-enriched words carry [grammaticalAtom, ...alternateAtoms] —
// the same closed-class umbrella mechanism applies to function words too.
const FUNCTION_ATOM_LISTS = Object.fromEntries(
  ALWAYS_PASS_WORDS.map(w => [
    w.word,
    [w.atomClass, ...(w.umbrellaAtoms ?? [])],
  ])
)

// ── Tokenization ────────────────────────────────────────────────────────────

// Splits text into word tokens with character offsets.
// Punctuation is captured as its own token so boundary patterns can see it.
function rawTokenize(text) {
  const tokens = []
  const regex = /[a-zA-Z'']+|[.,!?;:]/g
  let match
  while ((match = regex.exec(text)) !== null) {
    tokens.push({
      surface:  match[0],
      charSpan: [match.index, match.index + match[0].length],
    })
  }
  return tokens
}

// Builds the rich token stream the validator runs against.
// Each token carries: position, charSpan, base, formType, atoms[], flags.
export function tokenize(text, lang = 'en') {
  const raw = rawTokenize(text)
  return raw.map((t, i) => {
    const surface = t.surface
    const lower = surface.toLowerCase()
    const charSpan = t.charSpan

    // Punctuation
    if (/^[.,!?;:]$/.test(surface)) {
      return { surface, position: i, charSpan, atoms: [], formType: null,
               base: null, isPunctuation: true, isFunctionWord: false, isUnknown: false }
    }

    // Function words (a/the/and/or/...)
    if (FUNCTION_ATOM_LISTS[lower]) {
      return { surface, position: i, charSpan, atoms: FUNCTION_ATOM_LISTS[lower],
               formType: 'base', base: lower, isPunctuation: false,
               isFunctionWord: true, isUnknown: false }
    }

    // System vocabulary lookup
    const resolved = resolveSystemFormWithType(lower, lang)
    if (!resolved) {
      return { surface, position: i, charSpan, atoms: [], formType: null,
               base: null, isPunctuation: false, isFunctionWord: false, isUnknown: true }
    }

    const word = getResolvedWord(resolved.base, lang)
    const primary = word?.grammaticalAtom ? [word.grammaticalAtom] : []
    const alternates = (word?.alternateAtoms ?? []).map(a => a.atom).filter(Boolean)
    const atoms = [...new Set([...primary, ...alternates])]

    return {
      surface, position: i, charSpan,
      base:           resolved.base,
      formType:       resolved.type,
      atoms,
      // L2 fields exposed to pattern detectors. null when L2 is not enriched
      // for this word — patterns must handle missing values gracefully.
      countability:       word?.countability       ?? null,
      properNoun:         word?.properNoun         ?? null,
      concreteness:       word?.concreteness       ?? null,
      animate:            word?.animate            ?? null,
      transitivity:       word?.transitivity       ?? null,
      verbAspectClass:    word?.verbAspectClass    ?? null,
      commonCollocations: word?.commonCollocations ?? null,
      adjectivePosition:  word?.adjectivePosition  ?? null,
      adverbType:         word?.adverbType         ?? null,
      numeralType:        word?.numeralType        ?? null,
      person:             word?.person             ?? null,
      number:             word?.number             ?? null,
      gender:             word?.gender             ?? null,
      colloquial:         word?.colloquial         ?? false,
      lemmaFamily:        word?.lemmaFamily        ?? null,
      isPunctuation:  false,
      isFunctionWord: false,
      isUnknown:      false,
    }
  })
}

// ── License evaluator ───────────────────────────────────────────────────────

// Given a license declaration and the learner's active atoms, decide whether
// a fired pattern is allowed. Returns { allowed: bool, reason?: string }.
function evaluateLicense(license, activeAtomSet) {
  if (license?.alwaysForbidden) {
    return { allowed: false, reason: 'forbidden at this level' }
  }
  if (license?.requiresAtoms?.length > 0) {
    const missing = license.requiresAtoms.filter(a => !activeAtomSet.has(a))
    if (missing.length > 0) {
      return { allowed: false, reason: `needs atoms: ${missing.join(', ')}` }
    }
  }
  return { allowed: true }
}

// ── Validator entry point ───────────────────────────────────────────────────

// Validate a sentence under a given active-atom set.
// Returns:
//   { allowed, tokens, fired:    [{ patternId, group, span, info?, license, verdict }],
//                       failures: [{ patternId, group, span, reason, info? }],
//                       skipped:  [{ patternId, group, reason }] }  patterns disabled by config
export function validateSentence(text, activeAtoms, lang = 'en') {
  const tokens = tokenize(text, lang)
  const activeAtomSet = new Set(activeAtoms ?? [])
  const fired = []
  const failures = []
  const skipped = []

  for (const pattern of PATTERNS) {
    if (!isPatternEnabled(pattern.id, pattern.group)) {
      skipped.push({ patternId: pattern.id, group: pattern.group, reason: 'disabled' })
      continue
    }

    let matches = []
    try { matches = pattern.detector(tokens) ?? [] }
    catch (e) {
      console.warn(`[grammarBreaker] detector "${pattern.id}" threw:`, e)
      continue
    }

    for (const m of matches) {
      // Per-match license override (m.license) takes precedence over the
      // pattern-level license. Used by data-driven slot rules where each
      // match shape has its own coverage requirements (e.g. adverb_position
      // — sentence-end variants need only [adverb], pre-verb variants need
      // [adverb, lexical_verb]).
      const effectiveLicense = m.license ?? pattern.license
      const verdict = evaluateLicense(effectiveLicense, activeAtomSet)
      const fireRecord = {
        patternId: pattern.id,
        group:     pattern.group,
        span:      m.span,
        info:      m.info ?? null,
        // The effective license used for this match, plus a flag so dev
        // surfaces can distinguish per-match overrides from the pattern's
        // static license. Necessary because the Flow tab must show users
        // when a slot rule emits a per-shape license different from the
        // pattern-level one.
        license:               effectiveLicense,
        licenseFromMatch:      m.license != null,
        verdict,
      }
      fired.push(fireRecord)
      if (!verdict.allowed) {
        failures.push({
          patternId: pattern.id,
          group:     pattern.group,
          span:      m.span,
          reason:    verdict.reason,
          info:      m.info ?? null,
        })
      }
    }
  }

  // ── Token coverage check ────────────────────────────────────────────────
  // Architectural rule: every non-punctuation, non-unknown token must be
  // covered by the span of at least one ALLOWED fired pattern. This is
  // what catches incompleteness like "She is a good" (the `a` and `good`
  // tokens aren't licensed by any allowed pattern). It correctly allows
  // elliptical sentences like "She is." (every token covered).
  //
  // Forbidden patterns don't provide coverage — their tokens are
  // explicitly rejected. Function words DO need coverage; they have
  // grammatical roles in patterns.
  //
  // Suppression: skip the coverage check whenever ANY content token is
  // grammatically opaque to the validator. Two cases:
  //   isUnknown — surface form not in formsMap (no base resolves)
  //   atoms.length === 0 — known surface, but no atom info (e.g. word in
  //                        seed but not yet L2-enriched)
  // In both cases the grammar circuit has no information about that token
  // and patterns near it can't fire — so a coverage gap there is a false
  // positive. The word-level breaker handles word-level concerns; grammar
  // should stay silent rather than double-fail.
  const hasOpaqueContentToken = tokens.some(t =>
    !t.isPunctuation && !t.isFunctionWord && (t.isUnknown || (t.atoms?.length ?? 0) === 0)
  )
  if (!hasOpaqueContentToken) {
    const coveredTokens = new Set()
    for (const f of fired) {
      if (!f.verdict.allowed) continue
      for (let i = f.span[0]; i <= f.span[1]; i++) coveredTokens.add(i)
    }
    const uncovered = []
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i]
      if (t.isPunctuation) continue
      if (coveredTokens.has(i)) continue
      uncovered.push({ index: i, surface: t.surface })
    }
    if (uncovered.length > 0) {
      failures.push({
        patternId: '_coverage_gap',
        group:     '_meta',
        span:      [uncovered[0].index, uncovered[uncovered.length - 1].index],
        reason:    `uncovered tokens: ${uncovered.map(u => u.surface).join(', ')} — no allowed pattern licenses these`,
        info:      { uncoveredTokens: uncovered },
      })
    }
  }

  return {
    allowed: failures.length === 0,
    tokens,
    fired,
    failures,
    skipped,
  }
}
