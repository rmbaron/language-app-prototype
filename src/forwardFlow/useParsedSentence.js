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
// Cross-unit composition only. Per-slot detectors (matchVerb, detectSubjectShape,
// classifyLane, …) live in their unit folders; this file orchestrates them.

import { useMemo } from 'react'
import {
  detectSubjectShape, detectNounNumber, checkArticleAgreement,
  computeSubjectFeatures, expectedVerbAgreement,
} from './units/subject/detector'
import { classifyLane } from './units/exceptions/dispatch'
import { classifyAuxToken, ALL_AUX_AND_NEG, detectAuxConfiguration } from './units/verb/auxChain'
import { matchVerb } from './units/verb/detector'
import { checkAgreement } from './units/verb/agreement'
import { detectObjectShape } from './units/object/detector'
import { detectComplementShape } from './units/complement/detector'
import { detectAdverbialShape } from './units/adverbial/detector'

export function useParsedSentence(typedSentence) {
  const parsed = useMemo(() => {
    const trimmed = typedSentence.trim()
    if (!trimmed) {
      return {
        tokens: [], lane: 'empty', exceptionType: null,
        verbIndex: -1, matchedVerb: null, matchedVerbForm: null,
        subjectText: '',
        subjectShape: null, nounNumber: 'unknown', articleWarning: null,
        subjectFeatures: null, expectedAgreement: null, agreementCheck: null,
        auxChain: [], matchedChainIds: new Set(),
        auxConfiguration: null,
        objectAnalysis: null,
        complementAnalysis: null,
        adverbialAnalysis: null,
      }
    }
    const tokens = trimmed.split(/\s+/).filter(Boolean)
    const { lane, exceptionType } = classifyLane(tokens, trimmed)

    let verbIndex = -1
    let matchedVerb = null
    let matchedVerbForm = null
    for (let i = 0; i < tokens.length; i++) {
      const hit = matchVerb(tokens[i])
      if (hit) {
        verbIndex = i
        matchedVerb = hit.frame
        matchedVerbForm = { surface: hit.surface, base: hit.base, type: hit.type }
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

    // Cross-unit composition: subject features → expected pattern → verb-side check.
    const agreementCheck = (lane === 'fundamental' && matchedVerbForm && expectedAgreement)
      ? checkAgreement(matchedVerbForm, expectedAgreement.pattern, auxChain.length > 0)
      : null

    // Aux cluster configuration: which of the 6 named configurations the
    // current chain is in (Bare / Modal-led / Perfect-led / Progressive-led
    // / Passive-led / Do-support), or 'be_led_ambiguous' when BE leads but
    // the lexical form can't disambiguate Prog vs Pass.
    const auxConfiguration = matchedVerb
      ? detectAuxConfiguration(auxChain, matchedVerbForm)
      : null

    // Object analysis: route post-verb tokens through each of the verb's
    // permitted frames; pick the frame that best fits what's typed.
    // Heuristic: prefer no mismatch + non-empty objects, then no mismatch,
    // then first available. Multi-hypothesis frame tracking comes later.
    let objectAnalysis = null
    if (lane === 'fundamental' && matchedVerb && verbIndex >= 0) {
      const postVerbTokens = tokens.slice(verbIndex + 1)
      const candidates = (matchedVerb.frames ?? [])
        .map(f => detectObjectShape(postVerbTokens, f))
        .filter(Boolean)
      objectAnalysis =
        candidates.find(a => !a.mismatch && a.objects.length > 0) ??
        candidates.find(a => !a.mismatch) ??
        candidates[0] ??
        null
    }

    // Complement analysis: only on frames that license a complement (SVC or
    // SVOC). C-region tokens come from objectAnalysis.remainder — for SVC
    // that's everything post-verb; for SVOC it's everything past the Object.
    let complementAnalysis = null
    if (lane === 'fundamental' && matchedVerb && objectAnalysis) {
      const frameKey = objectAnalysis.frame
      if (frameKey === 'SVC' || frameKey === 'SVOC') {
        const frame = matchedVerb.frames?.find(f => f.slots.join('') === frameKey)
        if (frame) {
          const cTokens = objectAnalysis.remainder?.tokens ?? []
          complementAnalysis = detectComplementShape(cTokens, frame)
        }
      }
    }

    // Adverbial analysis: A-region = objectAnalysis.remainder for non-C
    // frames. For C-frames (SVC/SVOC), the remainder is consumed by C; A
    // would compete and v1 doesn't try. Argument vs adjunct labeling:
    // SVA/SVOA → argument; everything else → adjunct.
    let adverbialAnalysis = null
    if (lane === 'fundamental' && matchedVerb && objectAnalysis) {
      const frameKey = objectAnalysis.frame
      const isCFrame = frameKey === 'SVC' || frameKey === 'SVOC'
      if (!isCFrame) {
        const aTokens = objectAnalysis.remainder?.tokens ?? []
        const frame = matchedVerb.frames?.find(f => f.slots.join('') === frameKey)
        if (frame && (aTokens.length > 0 || frameKey === 'SVA' || frameKey === 'SVOA')) {
          adverbialAnalysis = detectAdverbialShape(aTokens, frame)
        }
      }
    }

    return {
      tokens, lane, exceptionType, verbIndex, matchedVerb, matchedVerbForm,
      subjectText, subjectShape, nounNumber, articleWarning,
      subjectFeatures, expectedAgreement, agreementCheck,
      auxChain, matchedChainIds, auxConfiguration,
      objectAnalysis, complementAnalysis, adverbialAnalysis,
    }
  }, [typedSentence])

  // Which slot-role cards should light up?
  //   • Subject    — fundamental lane, pre-verb text exists
  //   • Verb       — whenever a verb is matched (even imperatives have a verb)
  //   • Object     — fundamental lane, detector found at least one object
  //   • Complement — fundamental lane, frame is SVC or SVOC, structure matched
  //   • Adverbial  — fundamental lane, A-region matched (argument or adjunct)
  const activeRoles = useMemo(() => {
    const set = new Set()
    if (parsed.lane === 'fundamental' && parsed.subjectText) set.add('subject')
    if (parsed.matchedVerb) set.add('verb')
    if (parsed.objectAnalysis?.objects?.length > 0) set.add('object')
    if (parsed.complementAnalysis?.structure) set.add('complement')
    if (parsed.adverbialAnalysis?.structure) set.add('adverbial')
    return set
  }, [parsed.lane, parsed.subjectText, parsed.matchedVerb, parsed.objectAnalysis, parsed.complementAnalysis, parsed.adverbialAnalysis])

  return { ...parsed, activeRoles }
}
