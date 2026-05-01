// Forward Flow — Frame Library.
//
// Inverts the verb-first argumentStructures data into a frame-first index.
// Structure comes first; words follow. There are 7 frames; there can be
// arbitrarily many words per frame.

import { getArgumentStructures } from '../argumentStructures'

const VERB_STRUCTURES = getArgumentStructures('en')

const FRAME_METADATA = {
  'S+V':       { label: 'Intransitive',                          description: 'Verb takes only a subject. No object, no complement, no obligatory adverbial.' },
  'S+V+O':     { label: 'Transitive',                            description: 'Verb takes a subject and a single direct object.' },
  'S+V+O+O':   { label: 'Ditransitive',                          description: 'Verb takes two objects: indirect (recipient) before direct (theme). "He gave [me] [a book]."' },
  'S+V+O+A':   { label: 'Transitive + obligatory adverbial',     description: 'Verb takes a subject, an object, and an obligatory adverbial. Includes the dative-shifted form of ditransitives ("He gave a book to me") and verbs that require a locative ("She put the book on the table").' },
  'S+V+O+C':   { label: 'Transitive + object complement',        description: 'Verb takes a subject, an object, and a complement that predicates over the object. "She makes him happy."' },
  'S+V+A':     { label: 'Intransitive + obligatory adverbial',   description: 'Verb takes a subject and an obligatory adverbial. The verb cannot stand without it. "He lives in London."' },
  'S+V+C':     { label: 'Copular',                               description: 'Linking verb (be, seem, become, etc.) connects the subject to a complement that predicates over it. "She is happy."' },
}

export const FRAME_LIBRARY = (() => {
  const byFrame = new Map()
  for (const verb of VERB_STRUCTURES) {
    for (const frame of verb.frames) {
      const sig = frame.slots.join('+')
      if (!byFrame.has(sig)) {
        const meta = FRAME_METADATA[sig] ?? { label: sig, description: '' }
        byFrame.set(sig, {
          signature: sig,
          slots: frame.slots,
          label: meta.label,
          description: meta.description,
          verbs: [],
        })
      }
      byFrame.get(sig).verbs.push({ verb, frame })
    }
  }
  // Sort by slot count, then by signature.
  return [...byFrame.values()].sort((a, b) =>
    a.slots.length - b.slots.length || a.signature.localeCompare(b.signature)
  )
})()
