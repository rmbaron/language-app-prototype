// Exceptions unit — left-edge lane classification.
//
// classifyLane: given the tokens (and the original text), decide whether
// the sentence is on the fundamental lane (regular declarative — Subject
// first) or one of the exception lanes (operations / marked constructions).

import { getArgumentStructures } from '../verb/framesIndex'

const VERB_STRUCTURES = getArgumentStructures('en')

export const EXCEPTION_OPENERS = {
  yes_no_question: new Set([
    'do', 'does', 'did',
    'am', 'is', 'are', 'was', 'were',
    'have', 'has', 'had',
    'can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must',
  ]),
  wh_question: new Set([
    'what', 'where', 'when', 'why', 'how', 'who', 'whom', 'whose', 'which',
  ]),
  existential_or_locative: new Set(['there']),
  negative_inversion: new Set([
    'never', 'rarely', 'seldom', 'hardly', 'scarcely', 'nowhere',
  ]),
  adverbial_fronting: new Set([
    'yesterday', 'today', 'tomorrow', 'now',
    'sometimes', 'always', 'often', 'occasionally',
  ]),
  minor_sentence: new Set([
    'hello', 'hi', 'hey', 'wow', 'oh', 'ah', 'ouch', 'oops',
    'sorry', 'thanks', 'please', 'welcome', 'goodbye', 'bye',
    'okay', 'ok', 'yeah', 'hmm', 'well',
  ]),
  // Imperative is detected separately — verb baseForm at position 0.
  // Quotative is detected separately — leading quote character.
}

export const EXCEPTION_LANE_LABELS = {
  yes_no_question:         'Yes/no question',
  wh_question:             'Wh-question',
  existential_or_locative: 'Existential or locative-fronted',
  negative_inversion:      'Negative inversion',
  adverbial_fronting:      'Adverbial fronting',
  quotative_inversion:     'Quotative inversion',
  minor_sentence:          'Minor sentence / interjection',
  imperative:              'Imperative',
}

export const EXCEPTION_LANE_NOTES = {
  yes_no_question:         'Auxiliary or modal at position 0 — sentence opens with subject-aux inversion. Subject comes after the auxiliary; full handling in Phase 6 (operations).',
  wh_question:             'Wh-word at position 0 — sentence opens with wh-fronting. Full handling in Phase 6 (operations).',
  existential_or_locative: '"There" at position 0 — likely existential ("There is a problem") or locative-fronted ("There, on the table"). Full handling in Phase 5 (marked constructions).',
  negative_inversion:      'Negative or restrictive adverb at position 0 — forces subject-aux inversion. Marked register, often literary or emphatic.',
  adverbial_fronting:      'Time, place, or frequency adverb at position 0 — topicalized declarative. Subject and verb keep their normal order; only the adverbial moved.',
  quotative_inversion:     'Direct quotation at position 0, followed by an inverted verb of saying and its subject.',
  minor_sentence:          'A standalone discourse element — interjection, greeting, reply, or politeness marker. No Subject-Verb structure; the whole utterance is the unit.',
  imperative:              'Verb in base form at position 0 — sentence is an imperative; subject "you" is elided. Full handling in Phase 6 (subject_elision operation).',
}

export function classifyLane(tokens, originalText) {
  if (tokens.length === 0) return { lane: 'empty', exceptionType: null }

  // Quotative inversion: text starts with a quote character.
  if (originalText && /^["“'‘]/.test(originalText.trim())) {
    return { lane: 'exception', exceptionType: 'quotative_inversion' }
  }

  const word0 = tokens[0].toLowerCase().replace(/[^\w]/g, '')
  for (const [type, set] of Object.entries(EXCEPTION_OPENERS)) {
    if (set.has(word0)) return { lane: 'exception', exceptionType: type }
  }
  // Imperative: word 0 is a verb's baseForm
  if (VERB_STRUCTURES.some(v => v.baseForm === word0)) {
    return { lane: 'exception', exceptionType: 'imperative' }
  }
  return { lane: 'fundamental', exceptionType: null }
}
