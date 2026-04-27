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

// Full response evaluation — used by WritingLab submit.
// Takes the full user response + the live circuit token result.
// Returns { pass: bool, feedback: string, quality: 0–1 }
// quality drives per-word recording weight; pass is the gate.
// Swap this function body for a real AI call when ready — interface stays the same.
export async function evaluateResponse(userResponse, circuitTokens) {
  const text = userResponse.trim()
  if (text.split(/\s+/).length < 3) {
    return { pass: false, feedback: 'Write at least a full sentence.', quality: 0 }
  }

  const content = circuitTokens.filter(t => t.type !== 'punctuation' && t.type !== 'function')
  if (content.length === 0) {
    return { pass: false, feedback: 'No content words found.', quality: 0 }
  }

  const unknown = content.filter(t => t.type === 'unknown')
  const quality = (content.length - unknown.length) / content.length

  if (quality < 0.5) {
    return {
      pass: false,
      feedback: `${unknown.length} word${unknown.length !== 1 ? 's' : ''} outside your vocabulary: ${unknown.map(t => t.surface).join(', ')}.`,
      quality,
    }
  }

  return { pass: true, feedback: 'Good — your response was within your vocabulary.', quality }
}

// Speaking — evaluates a speech transcript
// Separate function so Speaking can have different criteria later
// (e.g. pronunciation scoring, stricter sentence requirements)
export async function evaluateSpeaking(targetWord, transcript) {
  return preCheck(targetWord, transcript)
}
