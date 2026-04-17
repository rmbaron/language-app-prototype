// Evaluation module — swappable per lane.
// Currently uses pre-checks only (no API calls, no cost).
// Each function can be upgraded independently to a real AI call when ready.
// Interface contract: always returns Promise<{ pass: boolean, feedback: string }>

function preCheck(targetWord, text) {
  const trimmed = text.trim().toLowerCase()
  const wordPresent = trimmed.includes(targetWord.toLowerCase())
  const longEnough = trimmed.split(/\s+/).length >= 3

  if (!wordPresent) {
    return { pass: false, feedback: `The word "${targetWord}" wasn't found. Make sure to use it.` }
  }
  if (!longEnough) {
    return { pass: false, feedback: 'Use the word in a full sentence, not just on its own.' }
  }
  return { pass: true, feedback: 'Good — the word was used in a sentence.' }
}

// Writing — evaluates typed text
export async function evaluateWriting(targetWord, userResponse) {
  return preCheck(targetWord, userResponse)
}

// Speaking — evaluates a speech transcript
// Separate function so Speaking can have different criteria later
// (e.g. pronunciation scoring, stricter sentence requirements)
export async function evaluateSpeaking(targetWord, transcript) {
  return preCheck(targetWord, transcript)
}
