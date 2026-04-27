import { buildBankSurfaceSet, resolveToBase } from './morphology.en.js'
import { FIXED_UNITS } from './multiWordUnits.en.js'

// Words that always pass — no lexical meaning, never banked as vocabulary.
// Keep this minimal: only articles and pure coordinating conjunctions.
// Pronouns, auxiliaries, prepositions — all go through the bank check.
export const ALWAYS_PASS_WORDS = [
  { word: 'a',   atomClass: 'determiner'  },
  { word: 'an',  atomClass: 'determiner'  },
  { word: 'the', atomClass: 'determiner'  },
  { word: 'and', atomClass: 'conjunction' },
  { word: 'but', atomClass: 'conjunction' },
  { word: 'or',  atomClass: 'conjunction' },
  { word: 'so',  atomClass: 'conjunction' },
  { word: 'yet', atomClass: 'conjunction' },
  { word: 'nor', atomClass: 'conjunction' },
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

// Returns tokens with multi-word units collapsed.
// Each token: { surface, type: 'fixed_unit'|'construction'|'single'|'punctuation', atomClass?, constructionType? }
export function tokenizeFull(text, atomWords = {}) {
  const sorted = [...FIXED_UNITS].sort((a, b) => b.text.split(' ').length - a.text.split(' ').length)

  // Build word → atomClass reverse map
  const wordToAtom = {}
  for (const [atomId, words] of Object.entries(atomWords)) {
    for (const w of words) wordToAtom[w] = atomId
  }

  const modalTriggers  = new Set((atomWords['modal_auxiliary'] ?? []).map(w => w.toLowerCase()))
  const copulaWords    = new Set((atomWords['copula']          ?? []).map(w => w.toLowerCase()))
  const lexicalVerbs   = new Set((atomWords['lexical_verb']    ?? []).map(w => w.toLowerCase()))
  // have/has/had as perfect auxiliary — hardcoded since perfect_auxiliary has no standalone words
  const perfectTriggers = new Set(['have', 'has', 'had'])
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

    // Try modal constructions — longest match first to avoid consuming a prefix
    // and leaving the rest stranded. Order: 4-token → 3-token → 2-token.
    const lower = raw[i].toLowerCase()
    if (modalTriggers.has(lower) && i + 1 < raw.length) {
      const n1 = raw[i + 1].toLowerCase()
      const n1Base = resolveToBase(n1)
      const n1IsPerfectAux = perfectTriggers.has(n1) || perfectTriggers.has(n1Base)
      const n1IsBeForm     = copulaWords.has(n1) || copulaWords.has(n1Base)

      // 4-token: will have been drinking (future_perfect_continuous)
      if (n1IsPerfectAux && i + 3 < raw.length) {
        const n2 = raw[i + 2].toLowerCase(); const n2Base = resolveToBase(n2)
        const n3 = raw[i + 3].toLowerCase(); const n3Base = resolveToBase(n3)
        if ((copulaWords.has(n2) || copulaWords.has(n2Base)) &&
            n3.endsWith('ing') && n3 !== n3Base &&
            (lexicalVerbs.has(n3Base) || wordToAtom[n3Base] === 'lexical_verb')) {
          result.push({ surface: [raw[i],raw[i+1],raw[i+2],raw[i+3]].join(' '), type: 'construction', constructionType: 'future_perfect_continuous', atomClass: 'modal_construction', sentenceIndex })
          i += 4; continue
        }
      }

      // 3-token: will be drinking (future_continuous)
      if (n1IsBeForm && i + 2 < raw.length) {
        const n2 = raw[i + 2].toLowerCase(); const n2Base = resolveToBase(n2)
        if (n2.endsWith('ing') && n2 !== n2Base &&
            (lexicalVerbs.has(n2Base) || wordToAtom[n2Base] === 'lexical_verb')) {
          result.push({ surface: [raw[i],raw[i+1],raw[i+2]].join(' '), type: 'construction', constructionType: 'future_continuous', atomClass: 'modal_construction', sentenceIndex })
          i += 3; continue
        }
      }

      // 3-token: will have drunk (future_perfect)
      if (n1IsPerfectAux && i + 2 < raw.length) {
        const n2 = raw[i + 2].toLowerCase(); const n2Base = resolveToBase(n2)
        if (lexicalVerbs.has(n2Base) || wordToAtom[n2Base] === 'lexical_verb') {
          result.push({ surface: [raw[i],raw[i+1],raw[i+2]].join(' '), type: 'construction', constructionType: 'future_perfect', atomClass: 'modal_construction', sentenceIndex })
          i += 3; continue
        }
      }

      // 2-token: will drink (future_simple / modal)
      if (wordToAtom[n1Base] === 'lexical_verb' || wordToAtom[n1] === 'lexical_verb') {
        result.push({ surface: raw[i] + ' ' + raw[i + 1], type: 'construction', constructionType: 'modal', atomClass: 'modal_construction', sentenceIndex })
        i += 2; continue
      }
    }

    // Try progressive construction: be-form + verb-ing (present/past continuous)
    const isBeForm = copulaWords.has(lower) || copulaWords.has(resolveToBase(lower))
    if (isBeForm && i + 1 < raw.length) {
      const nextLower = raw[i + 1].toLowerCase()
      const nextBase  = resolveToBase(nextLower)
      const isIngForm = nextLower.endsWith('ing') && nextLower !== nextBase
      if (isIngForm && (lexicalVerbs.has(nextBase) || lexicalVerbs.has(nextLower) || wordToAtom[nextBase] === 'lexical_verb' || wordToAtom[nextLower] === 'lexical_verb')) {
        result.push({ surface: raw[i] + ' ' + raw[i + 1], type: 'construction', constructionType: 'progressive', atomClass: 'progressive_construction', sentenceIndex })
        i += 2; continue
      }
    }

    // Try perfect constructions — longest match first.
    if (perfectTriggers.has(lower) && i + 1 < raw.length) {
      const n1 = raw[i + 1].toLowerCase(); const n1Base = resolveToBase(n1)
      const n1IsBeForm = copulaWords.has(n1) || copulaWords.has(n1Base)

      // 3-token: have been drinking (present/past perfect_continuous)
      if (n1IsBeForm && i + 2 < raw.length) {
        const n2 = raw[i + 2].toLowerCase(); const n2Base = resolveToBase(n2)
        if (n2.endsWith('ing') && n2 !== n2Base &&
            (lexicalVerbs.has(n2Base) || wordToAtom[n2Base] === 'lexical_verb')) {
          result.push({ surface: [raw[i],raw[i+1],raw[i+2]].join(' '), type: 'construction', constructionType: 'perfect_continuous', atomClass: 'perfect_construction', sentenceIndex })
          i += 3; continue
        }
      }

      // 2-token: have drunk (present/past perfect)
      const isLexVerb = lexicalVerbs.has(n1Base) || lexicalVerbs.has(n1)
        || wordToAtom[n1Base] === 'lexical_verb' || wordToAtom[n1] === 'lexical_verb'
      if (isLexVerb) {
        result.push({ surface: raw[i] + ' ' + raw[i + 1], type: 'construction', constructionType: 'perfect', atomClass: 'perfect_construction', sentenceIndex })
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
