// System Circuit — checks a sentence against the full system vocabulary.
//
// Unlike the user circuit breaker (circuitCheck.js), this does not check
// against any individual's word bank. It checks against every word the
// app has ever classified — the registry is the source of truth.
//
// Primary use: ingestion pipeline — identify which words in an ingested
// sentence the system recognizes, and what their atom/CEFR data is.
//
// Returns per-token results including character spans, which feed directly
// into contentPool entry wordAnnotations.

import { resolveSystemForm, hasSystemWord } from './formsMap'
import { getResolvedWord } from './wordRegistry'
import { splitSentences, ALWAYS_PASS_WORDS } from './circuitCheck'

const FUNCTION_WORDS = new Set(ALWAYS_PASS_WORDS.map(w => w.word))

// Tokenize a sentence into { surface, start, end } objects with char positions.
function tokenizeWithSpans(text) {
  const tokens = []
  const regex = /[a-zA-Z'']+/g
  let match
  while ((match = regex.exec(text)) !== null) {
    tokens.push({
      surface: match[0],
      start: match.index,
      end: match.index + match[0].length,
    })
  }
  return tokens
}

// Check a single sentence against the system vocabulary.
// Returns:
//   matched:  [{ surface, baseForm, atomId, cefrLevel, span }] — system vocab words
//   function: [{ surface, span }]                              — articles, conjunctions
//   unknown:  [{ surface, span }]                              — not recognized
export function checkSystemCircuit(sentence, lang = 'en') {
  const tokens = tokenizeWithSpans(sentence)
  const matched  = []
  const funcWords = []
  const unknown  = []

  for (const token of tokens) {
    const lower = token.surface.toLowerCase()
    const span = { start: token.start, end: token.end }

    if (FUNCTION_WORDS.has(lower)) {
      funcWords.push({ surface: token.surface, span })
      continue
    }

    if (!hasSystemWord(lower, lang)) {
      unknown.push({ surface: token.surface, span })
      continue
    }

    const baseForm = resolveSystemForm(lower, lang)
    if (!baseForm) { unknown.push({ surface: token.surface, span }); continue }

    const word = getResolvedWord(baseForm, lang)
    matched.push({
      surface:   token.surface,
      baseForm,
      atomId:    word?.grammaticalAtom ?? null,
      cefrLevel: word?.cefrLevel       ?? null,
      span,
    })
  }

  return { matched, function: funcWords, unknown }
}

// Check a block of text sentence by sentence.
// Returns an array of per-sentence results, each with the sentence text
// and its matched/unknown breakdown.
export function checkSystemCircuitBatch(text, lang = 'en') {
  const sentences = splitSentences(text)
  return sentences.map(s => ({
    index: s.index,
    text: s.text,
    terminator: s.terminator,
    ...checkSystemCircuit(s.text, lang),
  }))
}

// Summarize how much of a sentence the system vocabulary covers.
// Function words are excluded from the ratio — they're always present.
// Returns { total, matched, function, unknown, coverageRatio }
export function systemCircuitSummary(sentence, lang = 'en') {
  const result = checkSystemCircuit(sentence, lang)
  const total = result.matched.length + result.unknown.length
  return {
    total,
    matched:       result.matched.length,
    function:      result.function.length,
    unknown:       result.unknown.length,
    coverageRatio: total === 0 ? 0 : result.matched.length / total,
  }
}
