import { buildBankSurfaceSet, resolveToBase } from './morphology.en.js'
import { FIXED_UNITS } from './multiWordUnits.en.js'

// Words that always pass — no lexical meaning, never banked as vocabulary.
// Keep this minimal: only articles and pure coordinating conjunctions.
// Pronouns, auxiliaries, prepositions — all go through the bank check.
const ALWAYS_PASS = new Set([
  'a', 'an', 'the',
  'and', 'but', 'or', 'so', 'yet', 'nor',
])

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

// Returns tokens with multi-word units collapsed.
// Each token: { surface, type: 'fixed_unit'|'construction'|'single'|'punctuation', atomClass?, constructionType? }
export function tokenizeFull(text, atomWords = {}) {
  const sorted = [...FIXED_UNITS].sort((a, b) => b.text.split(' ').length - a.text.split(' ').length)

  // Build word → atomClass reverse map
  const wordToAtom = {}
  for (const [atomId, words] of Object.entries(atomWords)) {
    for (const w of words) wordToAtom[w] = atomId
  }

  const modalTriggers = new Set((atomWords['modal_auxiliary'] ?? []).map(w => w.toLowerCase()))
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

    // Try fixed units first (longest match)
    let matched = false
    for (const unit of sorted) {
      const uWords = unit.text.split(' ')
      const len = uWords.length
      if (i + len > raw.length) continue
      const slice = raw.slice(i, i + len).map(w => w.toLowerCase()).join(' ')
      if (slice === unit.text) {
        result.push({ surface: raw.slice(i, i + len).join(' '), type: 'fixed_unit', unitId: unit.id, atomClass: unit.atomClass, sentenceIndex })
        i += len; matched = true; break
      }
    }
    if (matched) continue

    // Try modal construction: modal trigger + lexical_verb
    const lower = raw[i].toLowerCase()
    if (modalTriggers.has(lower) && i + 1 < raw.length) {
      const nextLower = raw[i + 1].toLowerCase()
      const nextBase = resolveToBase(nextLower)
      if (wordToAtom[nextBase] === 'lexical_verb' || wordToAtom[nextLower] === 'lexical_verb') {
        result.push({ surface: raw[i] + ' ' + raw[i + 1], type: 'construction', constructionType: 'modal', atomClass: 'modal_construction', sentenceIndex })
        i += 2; continue
      }
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
