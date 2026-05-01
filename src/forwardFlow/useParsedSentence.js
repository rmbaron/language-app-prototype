// Forward Flow — parse a typed sentence into the macro-layer view.
//
// useParsedSentence(typedSentence) returns:
//   {
//     tokens, lane ('empty'|'fundamental'|'exception'), exceptionType,
//     verbIndex, matchedVerb, subjectText, subjectShape, nounNumber,
//     articleWarning, subjectFeatures, expectedAgreement, auxChain,
//     matchedChainIds (Set), activeRoles (Set)
//   }
//
// Phase 3a — process the typed sentence forward.
//   Word 0 is the dispatch point: it announces which lane the sentence is on.
//   For the fundamental lane: split tokens into Subject / aux-chain / Verb.
//   For exception lanes: detection only; full handling comes in later phases.
//
// Match on baseForm, lowercased, punctuation stripped. No morphology yet.

import { useMemo } from 'react'
import { getArgumentStructures } from '../argumentStructures'
import {
  detectSubjectShape, detectNounNumber, checkArticleAgreement,
  computeSubjectFeatures, expectedVerbAgreement,
} from '../subjectShapeDetector'
import { classifyLane, classifyAuxToken, ALL_AUX_AND_NEG } from './dispatch'

const VERB_STRUCTURES = getArgumentStructures('en')

export function useParsedSentence(typedSentence) {
  const parsed = useMemo(() => {
    const trimmed = typedSentence.trim()
    if (!trimmed) {
      return {
        tokens: [], lane: 'empty', exceptionType: null,
        verbIndex: -1, matchedVerb: null, subjectText: '',
        subjectShape: null, nounNumber: 'unknown', articleWarning: null,
        subjectFeatures: null, expectedAgreement: null,
        auxChain: [], matchedChainIds: new Set(),
      }
    }
    const tokens = trimmed.split(/\s+/).filter(Boolean)
    const { lane, exceptionType } = classifyLane(tokens, trimmed)

    let verbIndex = -1
    let matchedVerb = null
    for (let i = 0; i < tokens.length; i++) {
      const cleaned = tokens[i].toLowerCase().replace(/[^\w]/g, '')
      const match = VERB_STRUCTURES.find(v => v.baseForm === cleaned)
      if (match) {
        verbIndex = i
        matchedVerb = match
        break
      }
    }

    // Auxiliary chain: walk backwards from the lexical verb, picking up
    // canonical chain slots (Modal/Perfect/Progressive-or-Passive/Do-support)
    // and negation. The Subject ends where the chain begins.
    let chainStartIndex = verbIndex
    if (verbIndex > 0) {
      for (let i = verbIndex - 1; i >= 0; i--) {
        const t = tokens[i].toLowerCase().replace(/[^\w']/g, '')
        if (ALL_AUX_AND_NEG.has(t)) {
          chainStartIndex = i
        } else {
          break
        }
      }
    }
    const auxChain = (verbIndex > 0 && chainStartIndex < verbIndex)
      ? tokens.slice(chainStartIndex, verbIndex).map(tok => ({ token: tok, slot: classifyAuxToken(tok) }))
      : []

    // Subject candidate is meaningful only on the fundamental lane.
    // On exception lanes the subject is either elided (imperative), inverted
    // (yes/no, wh), or a dummy (existential) — handled later.
    const subjectText = lane === 'fundamental'
      ? (verbIndex >= 0 ? tokens.slice(0, chainStartIndex).join(' ') : tokens.join(' '))
      : ''

    const subjectShape = lane === 'fundamental' && subjectText
      ? detectSubjectShape(subjectText)
      : null
    const nounNumber = lane === 'fundamental' && subjectText
      ? detectNounNumber(subjectText)
      : 'unknown'
    const articleWarning = lane === 'fundamental' && subjectText
      ? checkArticleAgreement(subjectText)
      : null

    // Subject-Verb linking: once we have the Subject's shape, compute its
    // person/number features, then derive the expected verb agreement pattern.
    const subjectFeatures = (lane === 'fundamental' && subjectShape)
      ? computeSubjectFeatures(subjectText, subjectShape)
      : null
    const expectedAgreement = subjectFeatures
      ? expectedVerbAgreement(subjectFeatures)
      : null

    // Map detected chain elements to V-internal-chain catalog ids so we
    // can highlight the right catalog cards. The 'be_aux' detection is
    // ambiguous between Progressive and Passive, so it lights up both.
    const matchedChainIds = new Set()
    for (const { slot } of auxChain) {
      if (!slot) continue
      if (slot.id === 'be_aux') {
        matchedChainIds.add('progressive')
        matchedChainIds.add('passive')
      } else {
        matchedChainIds.add(slot.id)
      }
    }
    if (matchedVerb) matchedChainIds.add('lexical')

    return {
      tokens, lane, exceptionType, verbIndex, matchedVerb,
      subjectText, subjectShape, nounNumber, articleWarning,
      subjectFeatures, expectedAgreement, auxChain, matchedChainIds,
    }
  }, [typedSentence])

  // Which slot-role cards should light up?
  //   • Subject — only on the fundamental lane, and only when pre-verb text exists
  //   • Verb    — whenever a verb is matched (regardless of lane; even imperatives have a verb)
  // Object, Complement, Adverbial come online in Phase 3c.
  const activeRoles = useMemo(() => {
    const set = new Set()
    if (parsed.lane === 'fundamental' && parsed.subjectText) set.add('subject')
    if (parsed.matchedVerb) set.add('verb')
    return set
  }, [parsed.lane, parsed.subjectText, parsed.matchedVerb])

  return { ...parsed, activeRoles }
}
