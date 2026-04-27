import { checkCircuit, extractCreditableWordIds } from './circuitCheck'
import { resolveToBase } from './morphology.en.js'
import { evaluateResponse } from './evaluate'
import { recordUse, getUsage, getSessionId } from './wordUsageStore'
import { buildLearnerIntroduction, buildLevelChannel } from './systemVocabulary'
import { buildAISystemPrompt } from './aiIdentity'
import { ATOM_BY_ID } from './WritingLabTabs'

export default function useWritingLabHandlers({ identity, inventory, wordBank, currentCluster, st }) {
  // st = the full state object from useWritingLabState

  function buildPortrait() {
    const parts = []
    if (st.quantOn && st.quantText.trim()) parts.push(st.quantText.trim())
    if (st.qualOn  && st.qualText.trim())  parts.push(st.qualText.trim())
    return parts.length > 0 ? parts.join('\n\n') : null
  }

  function computeL1Prompt() { return buildAISystemPrompt(identity.lang) }
  function computeL2Prompt() { return buildLearnerIntroduction(inventory, buildPortrait()) }
  function computeL3Prompt() { return `${computeL2Prompt()}\n\n${buildLevelChannel(identity.cefrLevel, currentCluster)}` }

  async function handleL1Generate() {
    st.setL1Loading(true)
    try {
      const res = await fetch('/__generate-layer-test', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'l1', lang: identity.lang }),
      })
      const data = await res.json()
      st.setL1Result(data.sentence ?? data.text ?? '')
      st.setShowL1Output(true)
    } catch (e) {}
    finally { st.setL1Loading(false) }
  }

  async function handleL2Generate() {
    st.setL2Loading(true)
    try {
      const res = await fetch('/__generate-layer-test', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'l1l2', lang: identity.lang, learnerBlock: computeL2Prompt() }),
      })
      const data = await res.json()
      st.setL2Result(data.sentence ?? data.text ?? '')
      st.setShowL2Output(true)
    } catch (e) {}
    finally { st.setL2Loading(false) }
  }

  async function handleGenerateSample() {
    st.setSampleState('loading')
    try {
      const res = await fetch('/__generate-sample-portrait', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang: identity.lang }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error()
      st.setQualText(data.portrait)
      st.setQualOn(true)
      st.setSampleState('result')
    } catch { st.setSampleState('idle') }
  }

  async function handleL3(type) {
    st.setL3Loading(type); st.setL3Error(null)
    if (type === 'free') st.setL3FreeOutput(null)
    else st.setL3AskOutput(null)
    try {
      const res = await fetch('/__generate-layer-test', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'l1l2l3', lang: identity.lang, cefrLevel: identity.cefrLevel, currentCluster,
          learnerBlock: computeL2Prompt(),
          directiveOverride: type === 'ask'
            ? 'Ask this person one question to write about. Draw from what you know about them. Address them directly — use "you", not their name. Just the question, one sentence.'
            : undefined,
        }),
      })
      const data = await res.json()
      const output = data.sentence ?? data.text ?? ''
      if (type === 'free') { st.setL3FreeOutput(output); st.setShowL3Output(true) }
      else st.setL3AskOutput(output)
    } catch (e) { st.setL3Error(e.message) }
    finally { st.setL3Loading(null) }
  }

  async function handleFreeGenerate(mirrorPromptBlock) {
    st.setFreeLoading(true); st.setFreeError(null); st.setFreeOutput(null)
    try {
      const res = await fetch('/__generate-layer-test', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'l1l2l3l4', lang: identity.lang, cefrLevel: identity.cefrLevel, currentCluster,
          learnerBlock: computeL2Prompt(), promptBlock: mirrorPromptBlock,
        }),
      })
      const data = await res.json()
      st.setFreeOutput(data.sentence ?? data.text ?? '')
      st.setShowL4Output(true)
    } catch (e) { st.setFreeError(e.message) }
    finally { st.setFreeLoading(false) }
  }

  async function handleMirrorGenerate(mirrorPromptBlock, mirrorDirective) {
    st.setMirrorLoading(true); st.setMirrorError(null); st.setMirrorOutput(null); st.setCircuitTokens(null)
    try {
      const res = await fetch('/__generate-layer-test', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'l1l2l3l4', lang: identity.lang, cefrLevel: identity.cefrLevel, currentCluster,
          learnerBlock: computeL2Prompt(), promptBlock: mirrorPromptBlock, directiveOverride: mirrorDirective,
        }),
      })
      const data = await res.json()
      const output = data.sentence ?? data.text ?? ''
      st.setMirrorOutput(output)
      st.setCircuitTokens(checkCircuit(output, wordBank))
      st.setShowL5Output(true)
    } catch (e) { st.setMirrorError(e.message) }
    finally { st.setMirrorLoading(false) }
  }

  async function handleCustomL5() {
    if (!st.customL5.trim()) return
    st.setCustomLoading(true); st.setCustomError(null); st.setCustomOutput(null); st.setCustomTokens(null)
    try {
      const res = await fetch('/__generate-layer-test', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'l1l2l3', lang: identity.lang, cefrLevel: identity.cefrLevel, currentCluster,
          learnerBlock: computeL2Prompt(), directiveOverride: st.customL5.trim(),
        }),
      })
      const data = await res.json()
      const output = data.sentence ?? data.text ?? ''
      st.setCustomOutput(output)
      st.setCustomTokens(checkCircuit(output, wordBank))
    } catch (e) { st.setCustomError(e.message) }
    finally { st.setCustomLoading(false) }
  }

  async function handleGenerate({ targetAtomIds, activeAtoms, atomWords, grammarContextWords, effectiveTopicKey, cappedTopicWords, scope, difficulty, effectiveForce }) {
    if (targetAtomIds.size === 0) return
    st.setGenerating(true); st.setError(null); st.setGeneratedPrompt(null); st.setUserResponse('')
    try {
      const res = await fetch('/__generate-writing-prompt-v2', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetAtoms:  [...targetAtomIds].map(id => ({ id, label: ATOM_BY_ID[id]?.label, words: grammarContextWords })),
          activeAtoms:  activeAtoms.map(id => ({ id, label: ATOM_BY_ID[id]?.label, words: (atomWords[id] ?? []).slice(0, 8) })),
          vocabContext: { topic: effectiveTopicKey, words: cappedTopicWords },
          scope, difficulty, forceInstruction: effectiveForce,
          lang: identity.lang, cefrLevel: identity.cefrLevel,
        }),
      })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error ?? 'Failed') }
      const data = await res.json()
      st.setGeneratedPrompt(data.prompt)
    } catch (e) { st.setError(e.message) }
    finally { st.setGenerating(false) }
  }

  async function handleSubmit() {
    if (!st.userResponse.trim() || !st.userCircuitTokens) return
    st.setSubmitting(true)
    st.setSubmissionTrace(null)
    try {
      const nonPunct      = st.userCircuitTokens.filter(t => t.type !== 'punctuation')
      const bankedTokens  = nonPunct.filter(t => t.type === 'banked')
        .map(t => ({ surface: t.surface, baseId: resolveToBase(t.surface.toLowerCase()) }))
      const constructions = nonPunct.filter(t => t.type === 'construction')
        .map(t => ({ surface: t.surface, constructionType: t.constructionType }))
      const unknownTokens = nonPunct.filter(t => t.type === 'unknown').map(t => t.surface)
      const creditableIds = extractCreditableWordIds(st.userCircuitTokens)
      const contentTokens = nonPunct.filter(t => t.type !== 'function')
      const evaluation    = await evaluateResponse(st.userResponse, st.userCircuitTokens)

      let storeWrites = []
      if (evaluation.pass) {
        const sessionId = getSessionId()
        storeWrites = creditableIds.map(wordId => {
          const before = getUsage(wordId).writing
          recordUse(wordId, 'writing', evaluation.quality, sessionId)
          const after = getUsage(wordId).writing
          return { wordId, before: before.count, after: after.count }
        })
      }

      st.setSubmissionTrace({
        circuit:    { bankedTokens, constructions, unknownTokens, creditableIds },
        evaluation: { contentCount: contentTokens.length, unknownCount: unknownTokens.length, quality: evaluation.quality, pass: evaluation.pass, feedback: evaluation.feedback },
        store:      evaluation.pass ? storeWrites : null,
      })
    } finally {
      st.setSubmitting(false)
    }
  }

  return {
    computeL1Prompt, computeL2Prompt, computeL3Prompt,
    handleL1Generate, handleL2Generate, handleGenerateSample,
    handleL3, handleFreeGenerate, handleMirrorGenerate,
    handleCustomL5, handleGenerate, handleSubmit,
  }
}
