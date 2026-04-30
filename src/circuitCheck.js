import { buildBankSurfaceSet, resolveToBase } from './morphology.en.js'
import { FIXED_UNITS } from './multiWordUnits.en.js'
import { matchVerbConstruction } from './verbConstructions.en.js'

// Words that always pass — no lexical meaning, never banked as vocabulary.
// Keep this minimal: only articles and pure coordinating conjunctions.
// Pronouns, auxiliaries, prepositions — all go through the bank check.
//
// Each entry carries:
//   atomClass:     primary specific atom (e.g. 'indefinite_article')
//   umbrellaAtoms: cross-cutting umbrella atoms (e.g. 'determiner') — same
//                  shape as alternateAtoms on L2-enriched words, so patterns
//                  that match the umbrella ('determiner', 'conjunction') fire
//                  on these closed-class function words too.
export const ALWAYS_PASS_WORDS = [
  { word: 'a',   atomClass: 'indefinite_article',       umbrellaAtoms: ['determiner']  },
  { word: 'an',  atomClass: 'indefinite_article',       umbrellaAtoms: ['determiner']  },
  { word: 'the', atomClass: 'definite_article',         umbrellaAtoms: ['determiner']  },
  { word: 'and', atomClass: 'coordinating_conjunction', umbrellaAtoms: ['conjunction'] },
  { word: 'but', atomClass: 'coordinating_conjunction', umbrellaAtoms: ['conjunction'] },
  { word: 'or',  atomClass: 'coordinating_conjunction', umbrellaAtoms: ['conjunction'] },
  { word: 'so',  atomClass: 'coordinating_conjunction', umbrellaAtoms: ['conjunction'] },
  { word: 'yet', atomClass: 'coordinating_conjunction', umbrellaAtoms: ['conjunction'] },
  { word: 'nor', atomClass: 'coordinating_conjunction', umbrellaAtoms: ['conjunction'] },
]
const ALWAYS_PASS = new Set(ALWAYS_PASS_WORDS.map(w => w.word))

// Returns an array of tokens, each with:
//   { word, status: 'banked' | 'function' | 'unknown' | 'punctuation' }
export function checkCircuit(text, wordBank) {
  const surfaceSet = buildBankSurfaceSet(wordBank)
  const tokens = text.match(/[a-zA-Z'']+|[.,!?;:]/g) ?? []

  return tokens.map(word => {
    if (/^[.,!?;:]$/.test(word)) return { word, status: 'punctuation' }

    const lower = word.toLowerCase()

    if (ALWAYS_PASS.has(lower)) return { word, status: 'function' }

    // Check surface form first, then resolve to base and check again
    if (surfaceSet.has(lower) || surfaceSet.has(resolveToBase(lower)))
      return { word, status: 'banked' }

    return { word, status: 'unknown' }
  })
}

// ─── Sentence circuit ────────────────────────────────────────────────────────

// Splits raw text into sentence units using punctuation boundaries.
// '...' is NOT a sentence end. Single '.' and runs of '!?' are.
// Returns [{ index, text, terminator }]. Trailing text gets terminator: null.
export function splitSentences(text) {
  const segments = []
  let current = ''
  let index = 1
  const tokens = text.match(/\.{3}|[!?]+|\.|[^.!?]+/g) ?? []
  for (const tok of tokens) {
    if (tok === '...' || !/^([.!?]+)$/.test(tok)) {
      current += tok
    } else {
      const trimmed = current.trim()
      if (trimmed) segments.push({ index: index++, text: trimmed, terminator: tok })
      current = ''
    }
  }
  const trailing = current.trim()
  if (trailing) segments.push({ index: index, text: trailing, terminator: null })
  return segments
}

// ─── Multi-word aware tokenizer ──────────────────────────────────────────────

// Returns tokens with multi-word units collapsed. Two collapse mechanisms,
// both data-driven:
//   FIXED_UNITS         — exact multi-word phrases (in front of, as soon as)
//   VERB_CONSTRUCTIONS  — atom-shape patterns (modal + verb, copula + verb-ing, ...)
//
// Adding a new multi-word phrase = add a row to FIXED_UNITS.
// Adding a new verb construction = add a row to VERB_CONSTRUCTIONS. No new
// branches here — this function is generic.
//
// Each emitted token: { surface, type, sentenceIndex, atomClass?, atoms?,
//   unitId? (fixed_unit), constructionType? (construction) }
export function tokenizeFull(text, atomWords = {}, lang = 'en') {
  const fixedSorted = [...FIXED_UNITS].sort((a, b) => b.text.split(' ').length - a.text.split(' ').length)
  // \.{3} before [.,;:] so ellipsis is one token; [!?]+ so !! and ??? collapse to one token
  const raw = text.match(/[a-zA-Z'']+|\.{3}|[!?]+|[.,;:]/g) ?? []
  const result = []
  let i = 0
  let sentenceIndex = 1

  while (i < raw.length) {
    if (!/^[a-zA-Z'']/.test(raw[i])) {
      result.push({ surface: raw[i], type: 'punctuation', sentenceIndex })
      // '...' is ellipsis — not a sentence end. Single '.' or any run of !? is.
      if (raw[i] !== '...' && /^([.!?]+)$/.test(raw[i])) sentenceIndex++
      i++; continue
    }

    // Try fixed units first (longest match wins)
    let matched = false
    for (const unit of fixedSorted) {
      const uWords = unit.text.split(' ')
      const len = uWords.length
      if (i + len > raw.length) continue
      const slice = raw.slice(i, i + len).map(w => w.toLowerCase()).join(' ')
      if (slice === unit.text) {
        const atoms = [unit.atomClass, ...(unit.umbrellaAtoms ?? [])]
        result.push({
          surface: raw.slice(i, i + len).join(' '),
          type: 'fixed_unit', unitId: unit.id,
          atomClass: unit.atomClass, atoms,
          sentenceIndex,
        })
        i += len; matched = true; break
      }
    }
    if (matched) continue

    // Try verb constructions (declarative table, longest match wins)
    const construction = matchVerbConstruction(raw, i, atomWords, lang)
    if (construction) {
      const len = construction.shape.length
      result.push({
        surface: raw.slice(i, i + len).join(' '),
        type: 'construction',
        constructionType: construction.id,
        atomClass: construction.atomClass,
        atoms: [construction.atomClass],
        sentenceIndex,
      })
      i += len; continue
    }

    result.push({ surface: raw[i], type: 'single', sentenceIndex })
    i++
  }

  return result
}

// Full circuit check — returns richly annotated tokens including multi-word units
// type: 'fixed_unit' | 'construction' | 'banked' | 'function' | 'unknown' | 'punctuation'
export function checkCircuitFull(text, wordBank, atomWords = {}) {
  const surfaceSet = buildBankSurfaceSet(wordBank)
  const tokens = tokenizeFull(text, atomWords)

  return tokens.map(t => {
    if (t.type === 'fixed_unit' || t.type === 'construction' || t.type === 'punctuation') return t

    const lower = t.surface.toLowerCase()
    if (ALWAYS_PASS.has(lower)) return { ...t, type: 'function' }
    if (surfaceSet.has(lower) || surfaceSet.has(resolveToBase(lower))) return { ...t, type: 'banked' }
    return { ...t, type: 'unknown' }
  })
}

// Extracts creditable word IDs from a circuit result.
// Only banked tokens and constructions count — function words, unknowns, and punctuation don't.
// Returns base-form word IDs ready to pass to recordUse().
export function extractCreditableWordIds(tokens) {
  const ids = new Set()
  for (const t of tokens) {
    if (t.type === 'banked') {
      ids.add(resolveToBase(t.surface.toLowerCase()))
    } else if (t.type === 'construction') {
      // "will eat" or "am eating" — credit both component words
      for (const part of t.surface.toLowerCase().split(' ')) {
        ids.add(resolveToBase(part))
      }
    }
  }
  return [...ids]
}

export function circuitSummary(tokens) {
  const content = tokens.filter(t => t.status !== 'punctuation')
  const unknown = tokens.filter(t => t.status === 'unknown')
  return {
    passed: content.length - unknown.length,
    total: content.length,
    unknownWords: unknown.map(t => t.word),
    clean: unknown.length === 0,
  }
}
