import { buildBankSurfaceSet, resolveToBase } from './morphology.en.js'

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
