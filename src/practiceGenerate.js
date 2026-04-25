export const LANE_MAX_WORDS = {
  reading:   5,
  writing:   5,
  listening: 5,
  speaking:  5,
}

export const MIN_WORDS = 3

export async function generatePracticeSentence({ frame, lane = 'reading', recentSentences = [] }) {
  const res = await fetch('/__generate-sentence', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      frame,
      minWords: MIN_WORDS,
      maxWords: LANE_MAX_WORDS[lane] ?? 5,
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
