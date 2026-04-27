import { useState } from 'react'
import { buildLearnerIntroduction, buildWorldFolder, buildLevelChannel, buildDirective } from './systemVocabulary'
import AIText from './AIText'
import { scanAIText } from './wordScanner'
import { buildAISystemPrompt } from './aiIdentity'
import { CONSTRUCTOR_TIERS } from './constructorTiers.en'

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }

export default function InventoryMirrorLayersTab({ inventory, eligibleTiers, toggledOnAtoms }) {
  const { wordBank, identity, grammarPosition } = inventory
  const { atomWords, currentCluster } = grammarPosition
  const { lang, cefrLevel } = identity

  const [layerScope,      setLayerScope]      = useState('sentence')
  const [layerTier,       setLayerTier]       = useState(null)
  const [layerState,      setLayerState]      = useState('idle')
  const [layerResult,     setLayerResult]     = useState(null)
  const [layerResultMode, setLayerResultMode] = useState(null)
  const [layerPrompt,     setLayerPrompt]     = useState(null)
  const [showL1,          setShowL1]          = useState(false)
  const [showL2,          setShowL2]          = useState(false)
  const [showL3,          setShowL3]          = useState(false)
  const [editableL3,      setEditableL3]      = useState(null)
  const [showL4,          setShowL4]          = useState(false)
  const [editableL4,      setEditableL4]      = useState(null)
  const [showL5,          setShowL5]          = useState(false)
  const [editableL5,      setEditableL5]      = useState(null)
  const [layerCopied,     setLayerCopied]     = useState(false)

  const [quantOn,     setQuantOn]     = useState(false)
  const [qualOn,      setQualOn]      = useState(false)
  const [quantText,   setQuantText]   = useState('')
  const [qualText,    setQualText]    = useState('')
  const [sampleState, setSampleState] = useState('idle')

  function buildPortrait() {
    const parts = []
    if (quantOn && quantText.trim()) parts.push(quantText.trim())
    if (qualOn  && qualText.trim())  parts.push(qualText.trim())
    return parts.length > 0 ? parts.join('\n\n') : null
  }

  function buildMirrorWorldFolder() {
    return buildWorldFolder({
      grammarPosition: { activeAtoms: [...toggledOnAtoms], atomWords, currentCluster },
      identity,
    })
  }

  function computeL1Prompt() { return buildAISystemPrompt(lang) }
  function computeL2Prompt() { return buildLearnerIntroduction(inventory, buildPortrait()) }
  function computeL3Prompt() { return `${computeL2Prompt()}\n\n${buildLevelChannel(cefrLevel)}` }
  function computeL4Prompt() { return `${computeL2Prompt()}\n\n${buildLevelChannel(cefrLevel)}\n\n${buildMirrorWorldFolder()}` }
  function computeL5Prompt() { return buildDirective('layer-test', { scope: layerScope }) }

  async function handleGenerateSample() {
    setSampleState('loading')
    try {
      const res = await fetch('/__generate-sample-portrait', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error()
      setQualText(data.portrait)
      setQualOn(true)
      setSampleState('result')
    } catch {
      setSampleState('idle')
    }
  }

  async function handleLayerGenerate(mode) {
    setLayerState('loading')
    setLayerResult(null)
    setLayerPrompt(null)

    const learnerBlock = mode !== 'l1' ? buildLearnerIntroduction(inventory, buildPortrait()) : null

    const needsTier = mode === 'l1l2l3l4'
    const resolvedTierObj = needsTier
      ? (CONSTRUCTOR_TIERS.find(t => t.id === layerTier) ?? (eligibleTiers.length > 0 ? pick(eligibleTiers) : null))
      : null

    const tierBlock = resolvedTierObj
      ? `Structure: ${resolvedTierObj.label}\nExamples: ${resolvedTierObj.examples.join(' / ')}`
      : null

    const promptBlock = mode === 'l1l2l3l4' ? buildMirrorWorldFolder() : null

    try {
      const res = await fetch('/__generate-layer-test', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode, lang, learnerBlock, tierBlock, cefrLevel, currentCluster, promptBlock,
          scope: layerScope,
          directiveOverride: showL5 ? editableL5 : null,
          rawUserMessage: mode === 'l1l2l3l4' && showL4 ? editableL4 : mode === 'l1l2l3' && showL3 ? editableL3 : null,
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setLayerResult(data.sentence ?? '')
      setLayerPrompt(data.promptSent ?? null)
      setLayerResultMode(mode)
      setLayerState('result')
    } catch {
      setLayerState('error')
    }
  }

  const activeWordsList = [...new Set([...toggledOnAtoms].flatMap(id => atomWords[id] ?? []))]

  return (
    <div className="im-layers-tab">

      {/* scope */}
      <div className="im-layer-modes">
        {[['sentence', 'sentence'], ['paragraph', 'paragraph']].map(([m, label]) => (
          <button key={m} className={`im-layer-mode-btn${layerScope === m ? ' im-layer-mode-btn--active' : ''}`}
            onClick={() => setLayerScope(m)}>{label}</button>
        ))}
      </div>

      {/* L1 row */}
      <div className="im-generate-section">
        <div className="im-generate-controls">
          <span className="im-layer-desc" style={{ padding: 0, width: 28 }}>L1</span>
          <button className="im-generate-btn" disabled={layerState === 'loading'}
            onClick={() => handleLayerGenerate('l1')}>
            {layerState === 'loading' && layerResultMode === 'l1' ? 'generating…' : 'generate'}
          </button>
          <button className="im-words-btn" onClick={() => setShowL1(p => !p)}>
            {showL1 ? 'hide prompt' : 'show prompt'}
          </button>
        </div>
        {showL1 && <pre className="im-snapshot-block">{computeL1Prompt()}</pre>}
        {layerState === 'result' && layerResultMode === 'l1' && layerResult && (
          <div className="im-generate-result">
            <div className="im-generate-sentence">{layerResult}</div>
            <button className="im-copy-btn" onClick={() => { navigator.clipboard.writeText(layerResult); setLayerCopied(true); setTimeout(() => setLayerCopied(false), 1500) }}>{layerCopied ? 'copied ✓' : 'copy'}</button>
          </div>
        )}
      </div>

      {/* L2 portrait inputs */}
      <div className="im-generate-section" style={{ gap: 8 }}>
        <div className="im-layer-desc" style={{ padding: '0 0 4px' }}>Portrait — toggle to include in L2</div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <button className={`im-layer-mode-btn${quantOn ? ' im-layer-mode-btn--active' : ''}`} style={{ flexShrink: 0, marginTop: 2 }} onClick={() => setQuantOn(p => !p)}>quant</button>
          <textarea value={quantText} onChange={e => setQuantText(e.target.value)}
            placeholder="quantitative portrait — patterns, composition, position"
            style={{ flex: 1, minHeight: 50, background: '#0a0a18', border: '1px solid #2a2a4a', borderRadius: 3, color: '#7070a0', fontSize: 10, padding: '6px 8px', fontFamily: 'inherit', resize: 'vertical', opacity: quantOn ? 1 : 0.4 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <button className={`im-layer-mode-btn${qualOn ? ' im-layer-mode-btn--active' : ''}`} style={{ flexShrink: 0, marginTop: 2 }} onClick={() => setQualOn(p => !p)}>qual</button>
          <textarea value={qualText} onChange={e => setQualText(e.target.value)}
            placeholder="who this person is — not how they learn, but who they are"
            style={{ flex: 1, minHeight: 50, background: '#0a0a18', border: '1px solid #2a2a4a', borderRadius: 3, color: '#7070a0', fontSize: 10, padding: '6px 8px', fontFamily: 'inherit', resize: 'vertical', opacity: qualOn ? 1 : 0.4 }} />
        </div>
        <button className="im-generate-btn" onClick={handleGenerateSample} disabled={sampleState === 'loading'} style={{ alignSelf: 'flex-start' }}>
          {sampleState === 'loading' ? 'generating…' : 'generate sample user'}
        </button>
      </div>

      {/* L2 row */}
      <div className="im-generate-section">
        <div className="im-generate-controls">
          <span className="im-layer-desc" style={{ padding: 0, width: 28 }}>L2</span>
          <button className="im-generate-btn" disabled={layerState === 'loading'}
            onClick={() => handleLayerGenerate('l1l2')}>
            {layerState === 'loading' && layerResultMode === 'l1l2' ? 'generating…' : 'generate'}
          </button>
          <button className="im-words-btn" onClick={() => setShowL2(p => !p)}>
            {showL2 ? 'hide prompt' : 'show prompt'}
          </button>
        </div>
        {showL2 && <pre className="im-snapshot-block">{computeL2Prompt()}</pre>}
        {layerState === 'result' && layerResultMode === 'l1l2' && layerResult && (
          <div className="im-generate-result">
            <div className="im-generate-sentence">{layerResult}</div>
            <button className="im-copy-btn" onClick={() => {
              const parts = []
              if (qualOn && qualText.trim()) parts.push(`PORTRAIT\n${qualText.trim()}`)
              parts.push(`OUTPUT\n${layerResult}`)
              navigator.clipboard.writeText(parts.join('\n\n'))
              setLayerCopied(true)
              setTimeout(() => setLayerCopied(false), 1500)
            }}>{layerCopied ? 'copied ✓' : 'copy'}</button>
          </div>
        )}
        {layerState === 'error' && layerResultMode === 'l1l2' && <div className="im-generate-error">generation failed</div>}
      </div>

      {/* L3 row */}
      <div className="im-generate-section">
        <div className="im-generate-controls">
          <span className="im-layer-desc" style={{ padding: 0, width: 28 }}>L3</span>
          <button className="im-generate-btn" disabled={layerState === 'loading'}
            onClick={() => handleLayerGenerate('l1l2l3')}>
            {layerState === 'loading' && layerResultMode === 'l1l2l3' ? 'generating…' : 'generate'}
          </button>
          <button className="im-words-btn" onClick={() => {
            if (!showL3) setEditableL3(computeL3Prompt())
            setShowL3(p => !p)
          }}>
            {showL3 ? 'hide prompt' : 'show prompt'}
          </button>
          <span className="im-tier-chip-desc">{cefrLevel} level constraint</span>
        </div>
        {showL3 && (
          <textarea className="im-snapshot-block im-snapshot-editable"
            value={editableL3 ?? ''} onChange={e => setEditableL3(e.target.value)} />
        )}
        {layerState === 'result' && layerResultMode === 'l1l2l3' && layerResult && (
          <div className="im-generate-result">
            <div className="im-generate-sentence">{layerResult}</div>
            <button className="im-copy-btn" onClick={() => { navigator.clipboard.writeText(layerResult); setLayerCopied(true); setTimeout(() => setLayerCopied(false), 1500) }}>{layerCopied ? 'copied ✓' : 'copy'}</button>
          </div>
        )}
        {layerState === 'error' && layerResultMode === 'l1l2l3' && <div className="im-generate-error">generation failed</div>}
      </div>

      {/* L4 row */}
      <div className="im-generate-section">
        <div className="im-generate-controls">
          <span className="im-layer-desc" style={{ padding: 0, width: 28 }}>L4</span>
          <button className="im-generate-btn" disabled={layerState === 'loading' || activeWordsList.length === 0}
            onClick={() => handleLayerGenerate('l1l2l3l4')}>
            {layerState === 'loading' && layerResultMode === 'l1l2l3l4' ? 'generating…' : 'generate'}
          </button>
          <button className="im-words-btn" onClick={() => {
            if (!showL4) setEditableL4(computeL4Prompt())
            setShowL4(p => !p)
          }}>
            {showL4 ? 'hide prompt' : 'show prompt'}
          </button>
          <span className="im-tier-chip-desc">
            {activeWordsList.length} words · {layerTier ? `T${layerTier}` : 'random tier'}
          </span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
          <button className={`im-layer-mode-btn${layerTier === null ? ' im-layer-mode-btn--active' : ''}`}
            onClick={() => setLayerTier(null)}>rand</button>
          {eligibleTiers.map(t => (
            <button key={t.id}
              className={`im-layer-mode-btn${layerTier === t.id ? ' im-layer-mode-btn--active' : ''}`}
              onClick={() => setLayerTier(prev => prev === t.id ? null : t.id)}
              title={t.label}>T{t.id}</button>
          ))}
        </div>
        {showL4 && (
          <textarea className="im-snapshot-block im-snapshot-editable"
            value={editableL4 ?? ''} onChange={e => setEditableL4(e.target.value)} />
        )}
        {layerState === 'result' && layerResultMode === 'l1l2l3l4' && layerResult && (() => {
          const bankSet      = new Set(wordBank)
          const unknownWords = [...new Set(
            scanAIText(layerResult, bankSet)
              .filter(t => t.isWord && !t.isKnown)
              .map(t => t.normalized)
          )]
          const copyText = unknownWords.length > 0
            ? `${layerResult}\n\nUNKNOWN: ${unknownWords.join(', ')}`
            : layerResult
          return (
            <div className="im-generate-result">
              <div className="im-generate-sentence"><AIText text={layerResult} lang={lang} /></div>
              <button className="im-copy-btn" onClick={() => { navigator.clipboard.writeText(copyText); setLayerCopied(true); setTimeout(() => setLayerCopied(false), 1500) }}>{layerCopied ? 'copied ✓' : 'copy'}</button>
            </div>
          )
        })()}
        {layerState === 'error' && layerResultMode === 'l1l2l3l4' && <div className="im-generate-error">generation failed</div>}
      </div>

      {/* L5 row */}
      <div className="im-generate-section">
        <div className="im-generate-controls">
          <span className="im-layer-desc" style={{ padding: 0, width: 28 }}>L5</span>
          <button className="im-words-btn" onClick={() => {
            if (!showL5) setEditableL5(computeL5Prompt())
            setShowL5(p => !p)
          }}>
            {showL5 ? 'hide' : 'show directive'}
          </button>
          <span className="im-tier-chip-desc">what to do with this</span>
        </div>
        {showL5 && (
          <textarea className="im-snapshot-block im-snapshot-editable"
            value={editableL5 ?? ''} onChange={e => setEditableL5(e.target.value)} />
        )}
      </div>

    </div>
  )
}
