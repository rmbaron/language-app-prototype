import { useMemo } from 'react'
import { useInventory } from './InventoryContext'
import { getStrings } from './uiStrings'
import { CONSTRUCTOR_TIERS } from './constructorTiers.en.js'
import { getBankedWords } from './wordRegistry'
import { circuitSummary, checkCircuitFull } from './circuitCheck'
import WordMasteryStats from './WordMasteryStats'
import { T, btn, Label } from './writingLabTheme'
import {
  ATOM_BY_ID, CLUSTER_SCOPE, CLUSTER_FORCE,
  GrammarTargetTab, VocabularyContextTab, ScopeTab, ForceTab, PortraitTab,
  AssembledPromptPanel,
} from './WritingLabTabs'
import { CircuitDisplay, SentenceCircuitDisplay } from './WritingLabCircuit'
import { LayerSection, OutputBlock } from './WritingLabLayers'
import SubmissionTrace from './SubmissionTrace'
import useWritingLabState from './useWritingLabState'
import useWritingLabHandlers from './useWritingLabHandlers'

export default function WritingLab({ onBack }) {
  const { inventory } = useInventory()
  const s = getStrings(inventory.identity.interfaceLang)
  const { wordBank, identity, grammarPosition } = inventory
  const { atomWords, currentCluster, activeAtoms } = grammarPosition

  const st = useWritingLabState(activeAtoms)
  const {
    activeTab, setActiveTab,
    targetAtomIds, setTargetAtomIds, difficulty, setDifficulty,
    vocabMode, setVocabMode, selectedTopicKey, setSelectedTopicKey,
    scopeOverride, setScopeOverride,
    forceMode, setForceMode, customForce, setCustomForce,
    quantOn, setQuantOn, qualOn, setQualOn,
    quantText, setQuantText, qualText, setQualText, sampleState,
    l1Result, l1Loading, showL1Prompt, setShowL1Prompt, showL1Output, setShowL1Output,
    l2Result, l2Loading, showL2Prompt, setShowL2Prompt, showL2Output, setShowL2Output,
    l3FreeOutput, l3AskOutput, l3Loading, l3Error, showL3Prompt, setShowL3Prompt, showL3Output, setShowL3Output,
    freeOutput, freeLoading, freeError, showL4Prompt, setShowL4Prompt, showL4Output, setShowL4Output,
    mirrorOutput, circuitTokens, userCircuitTokens, setUserCircuitTokens, mirrorLoading, mirrorError,
    showL5Prompt, setShowL5Prompt, showL5Output, setShowL5Output,
    customL5, setCustomL5, customOutput, customTokens, customLoading, customError,
    generatedPrompt, userResponse, setUserResponse, generating, error, copied, setCopied,
    submitting, submissionTrace,
  } = st

  // Vocabulary context
  const wordObjects   = useMemo(() => getBankedWords(wordBank, identity.lang), [wordBank, identity.lang])
  const topicClusters = useMemo(() => {
    const clusters = {}
    for (const word of wordObjects) {
      const key = word.semanticSubtype ?? word.grammaticalCategory ?? 'other'
      if (!clusters[key]) clusters[key] = []
      clusters[key].push(word.id)
    }
    return clusters
  }, [wordObjects])

  // Derived context
  const scope             = scopeOverride !== null ? (CLUSTER_SCOPE[scopeOverride] ?? CLUSTER_SCOPE[1]) : (CLUSTER_SCOPE[currentCluster] ?? CLUSTER_SCOPE[1])
  const autoForce         = CLUSTER_FORCE[currentCluster] ?? null
  const effectiveForce    = forceMode === 'auto' ? autoForce : forceMode === 'manual' ? customForce : null
  const targetWords       = [...targetAtomIds].flatMap(id => atomWords[id] ?? [])
  const sortedTopicKeys   = Object.entries(topicClusters).sort((a, b) => b[1].length - a[1].length)
  const autoTopicKey      = sortedTopicKeys[0]?.[0] ?? null
  const effectiveTopicKey = vocabMode === 'auto' ? autoTopicKey : selectedTopicKey
  const topicWords        = effectiveTopicKey ? (topicClusters[effectiveTopicKey] ?? []) : []
  const intersectionWords = targetWords.filter(w => topicWords.includes(w))
  const grammarContextWords = intersectionWords.length >= 3
    ? intersectionWords.slice(0, 10)
    : [...new Set([...intersectionWords, ...targetWords])].slice(0, 10)
  const cappedTopicWords  = topicWords.slice(0, 15)

  const TEXTURE_ROLES = [
    { atomIds: ['noun'],                              label: 'The things in their world' },
    { atomIds: ['lexical_verb'],                      label: 'How they move through it' },
    { atomIds: ['adjective'],                         label: 'How they see and describe' },
    { atomIds: ['personal_pronoun', 'object_pronoun', 'possessive_determiner', 'demonstrative'], label: 'How they situate themselves' },
    { atomIds: ['interrogative'],                     label: 'The questions they can ask' },
  ]

  const worldTexture = useMemo(() => {
    const lines = []
    for (const role of TEXTURE_ROLES) {
      const words = role.atomIds.flatMap(id => atomWords[id] ?? []).filter(Boolean)
      if (words.length === 0) continue
      const emphasis = role.atomIds.some(id => targetAtomIds.has(id))
      lines.push(`${role.label}${emphasis ? ' (in focus)' : ''}: ${words.join(', ')}`)
    }
    const topTier = CONSTRUCTOR_TIERS.filter(t => t.band <= currentCluster).slice(-1)[0]
    if (topTier) lines.push(`What their sentences can hold: ${topTier.examples.slice(0, 3).join(' / ')}`)
    if (effectiveTopicKey && cappedTopicWords.length > 0)
      lines.push(`The conversation is moving through: ${effectiveTopicKey} — ${cappedTopicWords.join(', ')}`)
    return lines.join('\n')
  }, [atomWords, targetAtomIds, currentCluster, effectiveTopicKey, cappedTopicWords])

  const mirrorDirective = [
    `Ask this person one question — something they can respond to in writing, in ${scope.sentences}. Natural and conversational. Not like a language exercise. One sentence only.`,
    targetAtomIds.size > 0 && `Draw toward these structures if it fits naturally: ${[...targetAtomIds].map(id => ATOM_BY_ID[id]?.label ?? id).join(', ')}.`,
    effectiveForce && effectiveForce,
  ].filter(Boolean).join(' ')

  const handlers = useWritingLabHandlers({ identity, inventory, wordBank, currentCluster, st })
  const {
    computeL1Prompt, computeL2Prompt, computeL3Prompt,
    handleL1Generate, handleL2Generate, handleGenerateSample,
    handleL3, handleFreeGenerate, handleMirrorGenerate,
    handleCustomL5, handleGenerate, handleSubmit,
  } = handlers

  const TABS      = ['grammar', 'vocabulary', 'force', 'portrait']
  const canGen    = targetAtomIds.size > 0 && !generating
  const canSubmit = (userResponse ?? '').trim().length > 0
  const textarea  = { border: `1px solid ${T.border}`, borderRadius: 4, color: T.text, fontSize: 13, padding: '10px 12px', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6, width: '100%', background: T.card }

  return (
    <div style={{ padding: '24px 24px 80px', fontFamily: 'system-ui, sans-serif', background: T.page, minHeight: '100vh', color: T.text }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <button onClick={onBack} style={{ ...btn(), fontSize: 13 }}>{s.common.back}</button>
        <h2 style={{ margin: 0, fontSize: 20, color: T.text, fontWeight: 600 }}>{s.writingLab.title}</h2>
      </div>

      {/* ── L1 ── */}
      <LayerSection id="L1"
        onGenerate={handleL1Generate} loading={l1Loading}
        prompt={computeL1Prompt()} showPrompt={showL1Prompt} onTogglePrompt={() => setShowL1Prompt(p => !p)}
        hasOutput={!!l1Result} showOutput={showL1Output} onToggleOutput={() => setShowL1Output(p => !p)}
      >
        {showL1Output && l1Result && <OutputBlock text={l1Result} onCopy={() => navigator.clipboard.writeText(l1Result)} />}
      </LayerSection>

      {/* ── L2 ── */}
      <LayerSection id="L2" label="Portrait"
        onGenerate={handleL2Generate} loading={l2Loading}
        prompt={computeL2Prompt()} showPrompt={showL2Prompt} onTogglePrompt={() => setShowL2Prompt(p => !p)}
        hasOutput={!!l2Result} showOutput={showL2Output} onToggleOutput={() => setShowL2Output(p => !p)}
      >
        <div style={{ padding: '14px 16px', borderTop: `1px solid ${T.border}` }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
            <button onClick={() => setQuantOn(p => !p)} style={{ ...btn('blue', quantOn), flexShrink: 0, marginTop: 2, fontSize: 11, padding: '3px 10px' }}>quant</button>
            <textarea value={quantText} onChange={e => setQuantText(e.target.value)}
              placeholder="quantitative portrait — patterns, composition, position"
              style={{ ...textarea, minHeight: 48, opacity: quantOn ? 1 : 0.45, fontSize: 12 }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
            <button onClick={() => setQualOn(p => !p)} style={{ ...btn('blue', qualOn), flexShrink: 0, marginTop: 2, fontSize: 11, padding: '3px 10px' }}>qual</button>
            <textarea value={qualText} onChange={e => setQualText(e.target.value)}
              placeholder="who this person is — not how they learn, but who they are"
              style={{ ...textarea, minHeight: 48, opacity: qualOn ? 1 : 0.45, fontSize: 12 }} />
          </div>
          <button onClick={handleGenerateSample} disabled={sampleState === 'loading'}
            style={{ ...btn('blue', false), opacity: sampleState === 'loading' ? 0.4 : 1, cursor: sampleState === 'loading' ? 'default' : 'pointer' }}>
            {sampleState === 'loading' ? 'generating…' : 'generate sample user'}
          </button>
        </div>
        {showL2Output && l2Result && <OutputBlock text={l2Result} onCopy={() => navigator.clipboard.writeText(l2Result)} />}
      </LayerSection>

      {/* ── L3 ── */}
      <LayerSection id="L3"
        onGenerate={() => handleL3('free')} loading={l3Loading === 'free'}
        prompt={computeL3Prompt()} showPrompt={showL3Prompt} onTogglePrompt={() => setShowL3Prompt(p => !p)}
        hasOutput={!!l3FreeOutput} showOutput={showL3Output} onToggleOutput={() => setShowL3Output(p => !p)}
      >
        {showL3Output && l3FreeOutput && <OutputBlock label="Free output" text={l3FreeOutput} onCopy={() => navigator.clipboard.writeText(l3FreeOutput)} />}
        <div style={{ padding: '10px 14px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <button onClick={() => handleL3('ask')} disabled={l3Loading !== null}
            style={{ ...btn(), flexShrink: 0, opacity: l3Loading !== null ? 0.5 : 1, cursor: l3Loading ? 'default' : 'pointer' }}>
            {l3Loading === 'ask' ? 'generating…' : 'ask'}
          </button>
          {l3AskOutput && (
            <>
              <p style={{ margin: 0, fontSize: 15, color: T.text, lineHeight: 1.6, flex: 1 }}>{l3AskOutput}</p>
              <button onClick={() => navigator.clipboard.writeText(l3AskOutput)} style={{ ...btn(), flexShrink: 0, fontSize: 11 }}>copy</button>
            </>
          )}
        </div>
        {l3Error && <p style={{ fontSize: 12, color: T.red, margin: '0 14px 10px' }}>{l3Error}</p>}
      </LayerSection>

      {/* ── L4 ── */}
      <LayerSection id="L4" label="Positioning Layer"
        onGenerate={() => handleFreeGenerate(worldTexture)} loading={freeLoading}
        prompt={`${computeL3Prompt()}\n\n${worldTexture}`} showPrompt={showL4Prompt} onTogglePrompt={() => setShowL4Prompt(p => !p)}
        hasOutput={!!freeOutput} showOutput={showL4Output} onToggleOutput={() => setShowL4Output(p => !p)}
      >
        {showL4Output && freeOutput && <OutputBlock label="Output (no task)" text={freeOutput} onCopy={() => navigator.clipboard.writeText(freeOutput)} />}
        {freeError && <p style={{ fontSize: 12, color: T.red, margin: '0 14px 8px' }}>{freeError}</p>}

        <div style={{ padding: '14px 16px', borderTop: `1px solid ${T.border}`, background: '#dcdcde' }}>
          <Label>Constructor</Label>
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ ...btn('default', activeTab === tab), fontSize: 12 }}>
                {s.writingLab.tabs[tab]}
              </button>
            ))}
          </div>
          <div style={{ marginBottom: 4 }}>
            {activeTab === 'grammar'    && <GrammarTargetTab    activeAtoms={activeAtoms} atomWords={atomWords} targetAtomIds={targetAtomIds} setTargetAtomIds={setTargetAtomIds} difficulty={difficulty} setDifficulty={setDifficulty} />}
            {activeTab === 'vocabulary' && <VocabularyContextTab topicClusters={topicClusters} selectedTopicKey={selectedTopicKey} setSelectedTopicKey={setSelectedTopicKey} vocabMode={vocabMode} setVocabMode={setVocabMode} />}
            {activeTab === 'scope'      && <ScopeTab            currentCluster={currentCluster} scope={scope} />}
            {activeTab === 'force'      && <ForceTab            forceMode={forceMode} setForceMode={setForceMode} autoForce={autoForce} customForce={customForce} setCustomForce={setCustomForce} />}
            {activeTab === 'portrait'   && <PortraitTab />}
          </div>
          <AssembledPromptPanel cefrLevel={identity.cefrLevel} worldTexture={worldTexture} scope={scope} effectiveForce={effectiveForce} difficulty={difficulty} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: T.label, letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0 }}>Scope</span>
            {[1, 2, 3, 4].map(n => {
              const active = (scopeOverride ?? currentCluster) === n
              const isAuto = scopeOverride === null && n === currentCluster
              return (
                <button key={n} onClick={() => setScopeOverride(scopeOverride === n ? null : n)} style={{ ...btn('purple', active), fontSize: 12 }}>
                  C{n}{isAuto ? ' ·auto' : ''}
                </button>
              )
            })}
            <span style={{ fontSize: 12, color: T.textSub }}>{scope.sentences} · {scope.structure}</span>
          </div>
        </div>
      </LayerSection>

      {/* ── L5 ── */}
      <LayerSection id="L5"
        onGenerate={() => handleMirrorGenerate(worldTexture, mirrorDirective)} loading={mirrorLoading}
        prompt={mirrorDirective} showPrompt={showL5Prompt} onTogglePrompt={() => setShowL5Prompt(p => !p)}
        hasOutput={!!mirrorOutput} showOutput={showL5Output} onToggleOutput={() => setShowL5Output(p => !p)}
      >
        {showL5Output && mirrorOutput && (
          <div style={{ padding: '12px 14px', borderTop: `1px solid ${T.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: T.label, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Output</span>
              <button onClick={() => {
                const summary = circuitSummary(circuitTokens)
                navigator.clipboard.writeText([`OUTPUT: ${mirrorOutput}`, `CIRCUIT: ${summary.passed}/${summary.total} passed`, summary.unknownWords.length > 0 ? `UNKNOWN: ${summary.unknownWords.join(', ')}` : `UNKNOWN: none`].join('\n'))
              }} style={{ ...btn(), fontSize: 11 }}>copy</button>
            </div>
            <p style={{ margin: 0, fontSize: 16, color: T.text, lineHeight: 1.7 }}>{mirrorOutput}</p>
            {circuitTokens && <CircuitDisplay tokens={circuitTokens} />}
          </div>
        )}
        {mirrorError && <p style={{ fontSize: 12, color: T.red, margin: '0 14px 10px' }}>{mirrorError}</p>}

        {/* Custom directive */}
        <div style={{ padding: '14px 16px', borderTop: `1px solid ${T.border}`, background: '#dcdcde' }}>
          <Label>Custom Directive — L1–L3 only, no inventory</Label>
          <textarea value={customL5} onChange={e => setCustomL5(e.target.value)}
            placeholder="e.g. 'Ask me one thing to write about, at my level. Just the question.'"
            style={{ ...textarea, minHeight: 70, fontFamily: 'monospace', fontSize: 12 }} />
          <button onClick={handleCustomL5} disabled={!customL5.trim() || customLoading}
            style={{ ...btn('blue', false), marginTop: 8, opacity: !customL5.trim() || customLoading ? 0.4 : 1, cursor: !customL5.trim() || customLoading ? 'default' : 'pointer' }}>
            {customLoading ? 'sending…' : 'send (L1–L3)'}
          </button>
          {customError && <p style={{ fontSize: 12, color: T.red, marginTop: 8 }}>{customError}</p>}
          {customOutput && (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: T.label, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Output</span>
                <button onClick={() => {
                  const summary = circuitSummary(customTokens)
                  navigator.clipboard.writeText([`L5: ${customL5.trim()}`, `OUTPUT: ${customOutput}`, `CIRCUIT: ${summary.passed}/${summary.total} passed`, summary.unknownWords.length > 0 ? `UNKNOWN: ${summary.unknownWords.join(', ')}` : `UNKNOWN: none`].join('\n'))
                }} style={{ ...btn(), fontSize: 11 }}>copy</button>
              </div>
              <p style={{ margin: '0 0 8px', fontSize: 15, color: T.text, lineHeight: 1.7 }}>{customOutput}</p>
              {customTokens && <CircuitDisplay tokens={customTokens} />}
            </div>
          )}
        </div>

        {/* Generate + respond */}
        <div style={{ padding: '14px 16px', borderTop: `1px solid ${T.border}` }}>
          <button onClick={() => handleGenerate({ targetAtomIds, activeAtoms, atomWords, grammarContextWords, effectiveTopicKey, cappedTopicWords, scope, difficulty, effectiveForce })} disabled={!canGen}
            style={{ ...btn('green', false), width: '100%', padding: '10px', fontSize: 14, opacity: canGen ? 1 : 0.4, cursor: canGen ? 'pointer' : 'default' }}>
            {generating ? s.writingLab.generating : `${s.writingLab.generate} (just from writing)`}
          </button>
          {error && <p style={{ fontSize: 12, color: T.red, marginTop: 10 }}>{error}</p>}
          {generatedPrompt && (
            <div style={{ marginTop: 14, padding: '14px', background: T.greenBg, border: `1px solid ${T.greenBord}`, borderRadius: 6, marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: T.green, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Prompt</span>
                <button onClick={() => {
                  navigator.clipboard.writeText([
                    `CEFR: ${identity.cefrLevel ?? 'A1'}`,
                    `GRAMMAR TARGET: ${targetAtomIds.size > 0 ? `${[...targetAtomIds].map(id => ATOM_BY_ID[id]?.label ?? id).join(', ')} (D${difficulty})` : '(none)'}`,
                    `TARGET WORDS: ${grammarContextWords.join(', ') || '(none)'}`,
                    `VOCABULARY: ${effectiveTopicKey ? `${effectiveTopicKey} — ${cappedTopicWords.join(', ')}` : '(none)'}`,
                    `SCOPE: ${scope.sentences} · ${scope.structure}`,
                    effectiveForce ? `FORCE: ${effectiveForce}` : null, ``,
                    `PROMPT: ${generatedPrompt}`,
                  ].filter(l => l !== null).join('\n'))
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }} style={{ ...btn(), fontSize: 11 }}>{copied ? 'copied ✓' : 'copy'}</button>
              </div>
              <p style={{ margin: 0, fontSize: 18, color: T.text, lineHeight: 1.6 }}>{generatedPrompt}</p>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
            <button onClick={() => { setUserResponse(''); setUserCircuitTokens(null) }} style={{ ...btn(), fontSize: 11, padding: '3px 10px' }}>clear</button>
          </div>
          <textarea value={userResponse}
            onChange={e => {
              setUserResponse(e.target.value)
              setUserCircuitTokens(e.target.value.trim() ? checkCircuitFull(e.target.value, wordBank, atomWords) : null)
            }}
            placeholder={s.writingLab.responsePlaceholder}
            style={{ ...textarea, minHeight: 120, fontSize: 15 }} />
          <button onClick={handleSubmit} disabled={!canSubmit || submitting}
            style={{ ...btn('blue', false), marginTop: 10, width: '100%', padding: '10px', fontSize: 14, opacity: (canSubmit && !submitting) ? 1 : 0.4, cursor: (canSubmit && !submitting) ? 'pointer' : 'default' }}>
            {submitting ? 'evaluating…' : s.writingLab.submit}
          </button>
          {userCircuitTokens && <CircuitDisplay tokens={userCircuitTokens} />}
          {userResponse.trim() && <SentenceCircuitDisplay text={userResponse} wordBank={wordBank} wordTokens={userCircuitTokens} />}
          <SubmissionTrace trace={submissionTrace} />
          <details style={{ marginTop: 10 }}>
            <summary style={{ cursor: 'pointer', fontSize: 11, color: T.textDim, letterSpacing: '0.08em', userSelect: 'none' }}>DEV · word bar</summary>
            <div style={{ marginTop: 10, padding: '12px 14px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 6 }}>
              <div style={{ fontSize: 11, color: T.label, marginBottom: 8 }}>want</div>
              <WordMasteryStats key={submissionTrace} wordId="want" />
            </div>
          </details>
        </div>
      </LayerSection>

    </div>
  )
}
