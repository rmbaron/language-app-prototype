// Word scanner — checks AI-generated text against the learner's word bank.
// Pure function, no API call. Returns annotated tokens for rendering.
//
// Uses buildBankSurfaceSet to expand base forms into all inflected forms
// before checking, so "eating" matches "eat", "am/is/are" match "be", etc.

export { buildBankSurfaceSet, resolveToBase } from './morphology.en'

const WORD_RE = /([a-zA-Z]+)|([^a-zA-Z]+)/g

// Returns an array of tokens:
//   { text: string, isWord: boolean, isKnown: boolean, normalized: string|null }
export function scanAIText(text, wordBankSet) {
  const tokens = []
  WORD_RE.lastIndex = 0
  let match
  while ((match = WORD_RE.exec(text)) !== null) {
    if (match[1]) {
      const surface    = match[1]
      const normalized = surface.toLowerCase()
      tokens.push({ text: surface, isWord: true, isKnown: wordBankSet.has(normalized), normalized })
    } else {
      tokens.push({ text: match[2], isWord: false, isKnown: true, normalized: null })
    }
  }
  return tokens
}
