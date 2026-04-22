// Practice sentence generation — frontend API call.
//
// Calls the /__generate-sentence Vite dev endpoint, which proxies to Claude.
// The AI receives the eligible structure pool and the learner's word bank
// as a permission set — not a template to fill mechanically.
//
// Two modes:
//   generatePracticeSentence — live generation, all eligible structures, best sentence now
//   generateForCache         — single-structure mode, result tagged to one bucket
//
// Lane word count config — adjust per lane here:
export const LANE_MAX_WORDS = {
  reading:   5,
  writing:   5,
  listening: 5,
  speaking:  5,
}

export const MIN_WORDS = 3

// eligibleStructures — structure objects from getPracticePool()
// wordBankWords      — base form strings from the learner's word bank
// lane               — which practice lane (for max words lookup)
// maxWordsOverride — if provided, takes precedence over the lane config value
export async function generatePracticeSentence({ eligibleStructures, wordBankWords, lane = 'reading', maxWordsOverride, recentSentences = [] }) {
  const maxWords = maxWordsOverride ?? LANE_MAX_WORDS[lane] ?? 5

  const res = await fetch('/__generate-sentence', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eligibleStructures,
      wordBankWords,
      minWords: MIN_WORDS,
      maxWords,
      recentSentences,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? 'Generation failed')
  }

  const data = await res.json()
  return data.sentence
}

// ── Cache-fill mode ───────────────────────────────────────────
//
// Generates one sentence for a single structure bucket.
// Unlike generatePracticeSentence, only one structure is sent to the AI
// so the result is unambiguously tagged to that bucket.
//
// contentWords are derived client-side: the intersection of the user's
// word bank words with the words that appear in the generated sentence.
// This lets future retrieval filter by word bank without re-calling the AI.
//
// Returns { text, contentWords, wordCount } or throws.

function extractContentWords(sentenceText, wordBankWords) {
  const sentenceWords = new Set(
    sentenceText.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/)
  )
  return wordBankWords.filter(w => sentenceWords.has(w.toLowerCase()))
}

export async function generateForCache({ structure, wordBankWords, lane = 'reading' }) {
  const maxWords = LANE_MAX_WORDS[lane] ?? 5
  const text     = await generatePracticeSentence({
    eligibleStructures: [structure],
    wordBankWords,
    lane,
    maxWordsOverride: maxWords,
  })
  const contentWords = extractContentWords(text, wordBankWords)
  const wordCount    = text.trim().split(/\s+/).length
  return { text, contentWords, wordCount }
}
