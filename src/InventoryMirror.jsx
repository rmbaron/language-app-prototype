import { useState } from 'react'
import { useInventory } from './InventoryContext'
import { getStrings } from './uiStrings'
import { PROMPT_LABEL, buildCircle2, buildSnapshot, saveSnapshot, loadSnapshot, buildLearnerIntroduction, buildWorldFolder } from './systemVocabulary'
import { buildAISystemPrompt } from './aiIdentity'
import { GRAMMAR_CLUSTERS } from './grammarClustering.en'
import { CONSTRUCTOR_TIERS } from './constructorTiers.en'

const MAX_CLUSTER = Math.max(...GRAMMAR_CLUSTERS.map(c => c.id))

const TIER_CUMULATIVE_ATOMS = (() => {
  const result = {}
  const running = new Set()
  for (const tier of CONSTRUCTOR_TIERS) {
    tier.atoms.forEach(a => running.add(a))
    result[tier.id] = new Set(running)
  }
  return result
})()

export default function InventoryMirror({ onBack }) {
  const { inventory } = useInventory()
  const s = getStrings(inventory.identity.interfaceLang)
  const { wordBank, identity, grammarPosition } = inventory
  const { currentCluster, activeAtoms, atomWords } = grammarPosition
  const { lang, cefrLevel } = identity

  const [savedSnapshot,  setSavedSnapshot]  = useState(() => loadSnapshot())
  const [wordsAtom,      setWordsAtom]      = useState(null)
  const [clusterToggles, setClusterToggles] = useState(() => {
    const init = {}
    GRAMMAR_CLUSTERS.forEach(c => {
      init[c.id] = c.atoms.some(a => activeAtoms.includes(a) || (atomWords[a]?.length ?? 0) > 0)
    })
    return init
  })
  const [atomToggles, setAtomToggles] = useState(() => {
    const init = {}
    GRAMMAR_CLUSTERS.forEach(c => c.atoms.forEach(a => {
      init[a] = activeAtoms.includes(a) || (atomWords[a]?.length ?? 0) > 0
    }))
    return init
  })
  const [selectedTier,   setSelectedTier]   = useState(null)

  const activeSet  = new Set(activeAtoms)
  const circle2    = buildCircle2(MAX_CLUSTER, lang, cefrLevel)
  const circle3Set = new Set(wordBank)
  const gap        = circle2.words.filter(w => !circle3Set.has(w))
  const mode       = wordBank.length <= gap.length ? 'additions' : 'restrictions'

  function isClusterOn(id)  { return clusterToggles[id]  === true }
  function isAtomOn(atomId) { return atomToggles[atomId]  === true }
  function toggleCluster(id)  { setClusterToggles(prev => ({ ...prev, [id]: !isClusterOn(id) })) }
  function toggleAtom(atomId) { setAtomToggles(prev => ({ ...prev, [atomId]: !isAtomOn(atomId) })) }

  const toggledOnAtoms = new Set(
    GRAMMAR_CLUSTERS.flatMap(c => isClusterOn(c.id) ? c.atoms.filter(a => isAtomOn(a)) : [])
  )

  const eligibleTiers = CONSTRUCTOR_TIERS.filter(tier => {
    const needed = TIER_CUMULATIVE_ATOMS[tier.id]
    return needed.size === 0 || [...needed].every(a => toggledOnAtoms.has(a))
  })

  const clusterData = GRAMMAR_CLUSTERS.map(cluster => ({
    ...cluster,
    isActive: cluster.id <= currentCluster,
    atoms: cluster.atoms.map(atomId => {
      const systemWords = circle2.byAtom[atomId] ?? []
      return {
        atomId,
        label:      PROMPT_LABEL[atomId] ?? atomId,
        banked:     atomWords[atomId] ?? [],
        restricted: systemWords.filter(w => !circle3Set.has(w)),
        unlocked:   activeSet.has(atomId),
      }
    }),
  }))

  const [tab, setTab] = useState('mirror') // 'mirror' | 'layers'

  const [genState,    setGenState]    = useState('idle') // idle | loading | result | error
  const [genResult,   setGenResult]   = useState(null)
  const [copied,      setCopied]      = useState(false)

  // Layer test state
  const [layerMode,     setLayerMode]     = useState('l1') // 'l1' | 'l1l2' | 'l1l2l3'
  const [layerScope,    setLayerScope]    = useState('sentence') // 'sentence' | 'paragraph'
  const [layerTier,     setLayerTier]     = useState(null)
  const [layerState,      setLayerState]      = useState('idle')
  const [layerResult,     setLayerResult]     = useState(null)
  const [layerResultMode, setLayerResultMode] = useState(null)
  const [layerPrompt,     setLayerPrompt]     = useState(null)
  const [showL1,        setShowL1]        = useState(false)
  const [showL2,        setShowL2]        = useState(false)
  const [showL3,        setShowL3]        = useState(false)
  const [showL4,        setShowL4]        = useState(false)
  const [layerCopied,   setLayerCopied]   = useState(false)

  // Portrait test inputs
  const [quantOn,   setQuantOn]   = useState(false)
  const [qualOn,    setQualOn]    = useState(false)
  const [sampleState, setSampleState] = useState('idle') // idle | loading | result
  const [quantText, setQuantText] = useState('')
  const [qualText,  setQualText]  = useState('')

  const activeAtomIds   = [...toggledOnAtoms]
  const activeWordsList = [...new Set(activeAtomIds.flatMap(id => atomWords[id] ?? []))]
  const tierObj         = CONSTRUCTOR_TIERS.find(t => t.id === selectedTier) ?? null

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }

  async function handleGenerateSample() {
    setSampleState('loading')
    try {
      const res = await fetch('/__generate-sample-portrait', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordBank, lang }),
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

  function buildPortrait() {
    const parts = []
    if (quantOn && quantText.trim()) parts.push(quantText.trim())
    if (qualOn  && qualText.trim())  parts.push(qualText.trim())
    return parts.length > 0 ? parts.join('\n\n') : null
  }

  function computeL1Prompt() {
    return buildAISystemPrompt(lang)
  }

  function computeL2Prompt() {
    return buildLearnerIntroduction(inventory, buildPortrait())
  }

  function computeL3Prompt() {
    const scopeInstruction = layerScope === 'paragraph'
      ? 'Up to a paragraph (3–5 sentences). Let the thought breathe.'
      : 'One sentence only.'
    return `${computeL2Prompt()}\n\nSpeak at ${cefrLevel} level — vocabulary and structures natural at that level, nothing more complex. Full intelligence within that range. ${scopeInstruction}`
  }

  function buildMirrorWorldFolder() {
    return buildWorldFolder({
      grammarPosition: { activeAtoms: [...toggledOnAtoms], atomWords },
      identity,
    })
  }

  function computeL4Prompt() {
    const worldFolder = buildMirrorWorldFolder()
    const tierDesc = layerTier
      ? CONSTRUCTOR_TIERS.find(t => t.id === layerTier)
      : (eligibleTiers.length > 0 ? eligibleTiers[0] : null)
    const tierSection = tierDesc
      ? `\n\nStructure: ${tierDesc.label}\nExamples: ${tierDesc.examples.join(' / ')}`
      : ''
    const meetingOnly = computeL2Prompt().split('\nYou bring your full intelligence')[0]
    return `${meetingOnly}\n\nThis person is learning English. We have measured precisely which words and grammatical structures they have learned — no more, no less. Speaking within exactly that range is what helps them most right now. This is not an approximation.\n\n${worldFolder}${tierSection}\n\nSpeak to this person as a genuine presence — not as a teacher, not simplified, but within their exact world.`
  }

  function buildCurrentPromptBlock() {
    const lines = [`LEVEL: ${cefrLevel}`, 'AVAILABLE']
    for (const atomId of toggledOnAtoms) {
      const banked = atomWords[atomId] ?? []
      if (banked.length > 0) {
        lines.push(`  ${PROMPT_LABEL[atomId] ?? atomId}: ${banked.join(', ')}`)
      }
    }
    return lines.join('\n')
  }

  async function handleGenerate() {
    if (activeWordsList.length === 0) return

    const tier = tierObj ?? (eligibleTiers.length > 0 ? pick(eligibleTiers) : null)
    if (!tier) { setGenState('error'); return }

    setGenState('loading')
    setGenResult(null)

    const promptBlock = buildCurrentPromptBlock()

    try {
      const res = await fetch('/__generate-mirror', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: { label: tier.label, examples: tier.examples }, promptBlock, lang }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setGenResult(data.sentence ?? '')
      setGenState('result')
    } catch {
      setGenState('error')
    }
  }

  function buildCopyText() {
    const lines = [
      `SENTENCE: ${genResult}`,
      ``,
      `TIER: ${tierObj ? tierObj.label : 'none selected'}`,
      `ACTIVE ATOMS: ${activeAtomIds.join(', ') || '—'}`,
      `WORDS USED: ${activeWordsList.join(', ') || '—'}`,
    ]
    return lines.join('\n')
  }

  function handleCopy() {
    navigator.clipboard.writeText(buildCopyText())
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  async function handleLayerGenerate(mode = layerMode) {
    setLayerState('loading')
    setLayerResult(null)
    setLayerPrompt(null)

    const learnerBlock = mode !== 'l1'
      ? buildLearnerIntroduction(inventory, buildPortrait())
      : null

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
        body: JSON.stringify({ mode, lang, learnerBlock, tierBlock, cefrLevel, promptBlock, scope: layerScope }),
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

  function handleTakeSnapshot() {
    const snap = buildSnapshot({ wordBank, identity, grammarPosition })
    saveSnapshot(snap)
    setSavedSnapshot({ ...snap, takenAt: Date.now() })
  }

  return (
    <div className="im-screen">

      <div className="im-header">
        <button className="back-btn" onClick={onBack}>{s.common.back}</button>
        <h2 className="im-title">{s.inventoryMirror.title}</h2>
        <span className="im-header-stats">
          {cefrLevel} · C{currentCluster} · {wordBank.length} banked · {gap.length} restricted
        </span>
      </div>

      {/* TAB STRIP */}
      <div className="im-tab-strip">
        <button className={`im-tab${tab === 'mirror' ? ' im-tab--active' : ''}`} onClick={() => setTab('mirror')}>Mirror</button>
        <button className={`im-tab${tab === 'layers' ? ' im-tab--active' : ''}`} onClick={() => setTab('layers')}>Layers</button>
      </div>

      {tab === 'layers' && (
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
                {layerState === 'loading' && layerMode === 'l1' ? 'generating…' : 'generate'}
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
                {layerState === 'loading' && layerMode === 'l1l2' ? 'generating…' : 'generate'}
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

          {/* L3 row — CEFR constraint */}
          <div className="im-generate-section">
            <div className="im-generate-controls">
              <span className="im-layer-desc" style={{ padding: 0, width: 28 }}>L3</span>
              <button className="im-generate-btn" disabled={layerState === 'loading'}
                onClick={() => handleLayerGenerate('l1l2l3')}>
                {layerState === 'loading' && layerResultMode === 'l1l2l3' ? 'generating…' : 'generate'}
              </button>
              <button className="im-words-btn" onClick={() => setShowL3(p => !p)}>
                {showL3 ? 'hide prompt' : 'show prompt'}
              </button>
              <span className="im-tier-chip-desc">{cefrLevel} level constraint</span>
            </div>
            {showL3 && <pre className="im-snapshot-block">{computeL3Prompt()}</pre>}
            {layerState === 'result' && layerResultMode === 'l1l2l3' && layerResult && (
              <div className="im-generate-result">
                <div className="im-generate-sentence">{layerResult}</div>
                <button className="im-copy-btn" onClick={() => { navigator.clipboard.writeText(layerResult); setLayerCopied(true); setTimeout(() => setLayerCopied(false), 1500) }}>{layerCopied ? 'copied ✓' : 'copy'}</button>
              </div>
            )}
            {layerState === 'error' && layerResultMode === 'l1l2l3' && <div className="im-generate-error">generation failed</div>}
          </div>

          {/* L4 row — specific inventory constraint */}
          <div className="im-generate-section">
            <div className="im-generate-controls">
              <span className="im-layer-desc" style={{ padding: 0, width: 28 }}>L4</span>
              <button className="im-generate-btn" disabled={layerState === 'loading' || activeWordsList.length === 0}
                onClick={() => handleLayerGenerate('l1l2l3l4')}>
                {layerState === 'loading' && layerResultMode === 'l1l2l3l4' ? 'generating…' : 'generate'}
              </button>
              <button className="im-words-btn" onClick={() => setShowL4(p => !p)}>
                {showL4 ? 'hide prompt' : 'show prompt'}
              </button>
              <span className="im-tier-chip-desc">
                {activeWordsList.length} words · {layerTier ? `T${layerTier}` : 'random tier'}
              </span>
            </div>
            {/* tier selector for L4 */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
              <button
                className={`im-layer-mode-btn${layerTier === null ? ' im-layer-mode-btn--active' : ''}`}
                onClick={() => setLayerTier(null)}>rand</button>
              {eligibleTiers.map(t => (
                <button key={t.id}
                  className={`im-layer-mode-btn${layerTier === t.id ? ' im-layer-mode-btn--active' : ''}`}
                  onClick={() => setLayerTier(prev => prev === t.id ? null : t.id)}
                  title={t.label}>T{t.id}</button>
              ))}
            </div>
            {showL4 && <pre className="im-snapshot-block">{computeL4Prompt()}</pre>}
            {layerState === 'result' && layerResultMode === 'l1l2l3l4' && layerResult && (
              <div className="im-generate-result">
                <div className="im-generate-sentence">{layerResult}</div>
                <button className="im-copy-btn" onClick={() => { navigator.clipboard.writeText(layerResult); setLayerCopied(true); setTimeout(() => setLayerCopied(false), 1500) }}>{layerCopied ? 'copied ✓' : 'copy'}</button>
              </div>
            )}
            {layerState === 'error' && layerResultMode === 'l1l2l3l4' && <div className="im-generate-error">generation failed</div>}
          </div>

        </div>
      )}

      {tab === 'mirror' && <>

      {/* TIER STRIP */}
      <div className="im-tier-strip">
        <button
          className={`im-tier-chip im-tier-chip--eligible${selectedTier === null ? ' im-tier-chip--selected' : ''}`}
          onClick={() => setSelectedTier(null)}
        >
          RAN
        </button>
        {CONSTRUCTOR_TIERS.map(tier => {
          const eligible = eligibleTiers.includes(tier)
          const selected = selectedTier === tier.id
          return (
            <button
              key={tier.id}
              className={`im-tier-chip${eligible ? ' im-tier-chip--eligible' : ''}${selected ? ' im-tier-chip--selected' : ''}`}
              onClick={() => eligible && setSelectedTier(prev => prev === tier.id ? null : tier.id)}
            >
              T{tier.id}
            </button>
          )
        })}
        {selectedTier && (
          <span className="im-tier-chip-desc">
            {CONSTRUCTOR_TIERS.find(t => t.id === selectedTier)?.label.replace(/^T\d+: /, '')}
          </span>
        )}
      </div>

      {/* CLUSTER / ATOM LIST */}
      {clusterData.map(cluster => (
        <div key={cluster.id} className={`im-cluster${!isClusterOn(cluster.id) ? ' im-cluster--future' : ''}`}>

          <div
            className={`im-cluster-header${isClusterOn(cluster.id) ? ' im-cluster-header--on' : ' im-cluster-header--off'}`}
            onClick={() => toggleCluster(cluster.id)}
          >
            <span className="im-cluster-check">{isClusterOn(cluster.id) ? '☑' : '☐'}</span>
            <span className="im-cluster-badge">C{cluster.id}</span>
            <span className="im-cluster-name">{cluster.label}</span>
            {!cluster.isActive && !isClusterOn(cluster.id) && <span className="im-cluster-future">not yet active</span>}
          </div>

          <div className="im-atom-list">
            {cluster.atoms.map(({ atomId, label, banked, restricted, unlocked }) => {
              const showingWords = wordsAtom === atomId
              const atomOn = isAtomOn(atomId)
              return (
                <div
                  key={atomId}
                  className={`im-atom-row${!atomOn ? ' im-atom-row--off' : ''}`}
                  onClick={() => toggleAtom(atomId)}
                >
                  <div className="im-atom-summary">
                    <span className="im-atom-check">{atomOn ? '☑' : '☐'}</span>
                    <span className={`im-atom-badge${atomOn ? ' im-atom-badge--on' : ''}`}>{label}</span>
                    <span className="im-split-learner">{banked.length} on</span>
                    <span className="im-split-divider">·</span>
                    <span className="im-split-ai">
                      {restricted.length === 0 ? '✓' : `${restricted.length} off`}
                    </span>
                    <button
                      className="im-words-btn"
                      onClick={e => { e.stopPropagation(); setWordsAtom(prev => prev === atomId ? null : atomId) }}
                    >
                      {showingWords ? 'hide' : 'words'}
                    </button>
                  </div>
                  {showingWords && (
                    <div className="im-atom-detail">
                      <div className="im-detail-line im-detail-line--banked">on: {banked.length > 0 ? banked.join(', ') : '—'}</div>
                      <div className="im-detail-line im-detail-line--restricted">off: {restricted.length > 0 ? restricted.join(', ') : '✓ all available'}</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* GENERATE */}
      <div className="im-generate-section">
        <div className="im-generate-controls">
          <button
            className="im-generate-btn"
            onClick={handleGenerate}
            disabled={genState === 'loading' || activeWordsList.length === 0}
          >
            {genState === 'loading' ? 'generating…' : 'generate sentence'}
          </button>
          <span className="im-generate-meta">
            {tierObj ? tierObj.label : 'no tier selected'} · {activeWordsList.length} words active
          </span>
        </div>

        {genState === 'error' && (
          <div className="im-generate-error">generation failed</div>
        )}

        {genState === 'result' && genResult && (
          <div className="im-generate-result">
            <div className="im-generate-sentence">{genResult}</div>
            <div className="im-generate-info">
              <span className="im-generate-info-line">atoms: {activeAtomIds.map(a => PROMPT_LABEL[a] ?? a).join(', ') || '—'}</span>
              <span className="im-generate-info-line">words: {activeWordsList.join(', ')}</span>
            </div>
            <button className="im-copy-btn" onClick={handleCopy}>
              {copied ? 'copied ✓' : 'copy'}
            </button>
          </div>
        )}
      </div>

      {/* SNAPSHOT */}
      <div className="im-snapshot-section">
        <button className="im-snapshot-btn" onClick={handleTakeSnapshot}>
          take snapshot · mode: {mode}
        </button>
        {savedSnapshot && (
          <div className="im-snapshot-result">
            <div className="im-snapshot-meta">
              cluster {savedSnapshot.currentCluster ?? '?'} · {savedSnapshot.circle3?.length ?? 0} words · {savedSnapshot.mode}
            </div>
            <pre className="im-snapshot-block">{savedSnapshot.promptBlock}</pre>
          </div>
        )}
      </div>

      </>}

    </div>
  )
}
