import { useState } from 'react'
import { useInventory } from './InventoryContext'
import { getStrings } from './uiStrings'
import { PROMPT_LABEL, buildCircle2, buildSnapshot, saveSnapshot, loadSnapshot, buildLearnerIntroduction } from './systemVocabulary'
import AIText from './AIText'
import { scanAIText, buildBankSurfaceSet } from './wordScanner'
import { buildAISystemPrompt } from './aiIdentity'
import { GRAMMAR_CLUSTERS } from './grammarClustering.en'
import { CONSTRUCTOR_TIERS } from './constructorTiers.en'
import InventoryMirrorLayersTab from './InventoryMirrorLayersTab'

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
  const [selectedTier, setSelectedTier] = useState(null)
  const [tab,          setTab]          = useState('mirror')
  const [genState,     setGenState]     = useState('idle')
  const [genResult,    setGenResult]    = useState(null)
  const [copied,       setCopied]       = useState(false)

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

  const tierObj         = CONSTRUCTOR_TIERS.find(t => t.id === selectedTier) ?? null
  const activeAtomIds   = [...toggledOnAtoms]
  const activeWordsList = [...new Set(activeAtomIds.flatMap(id => atomWords[id] ?? []))]

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }

  async function handleGenerate() {
    if (activeWordsList.length === 0) return
    const tier = tierObj ?? (eligibleTiers.length > 0 ? pick(eligibleTiers) : null)
    if (!tier) { setGenState('error'); return }
    setGenState('loading')
    setGenResult(null)

    const tierBlock = `Structure: ${tier.label}\nExamples: ${tier.examples.join(' / ')}`

    try {
      const res = await fetch('/__generate-layer-test', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'l1l2l3l4', lang, cefrLevel, currentCluster,
          learnerBlock: buildLearnerIntroduction(inventory),
          promptBlock:  buildWorldFolderFromToggles(),
          tierBlock,
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setGenResult(data.sentence ?? '')
      setGenState('result')
    } catch {
      setGenState('error')
    }
  }

  function buildWorldFolderFromToggles() {
    const lines = ['AVAILABLE']
    for (const atomId of toggledOnAtoms) {
      const banked = atomWords[atomId] ?? []
      if (banked.length > 0) lines.push(`  ${PROMPT_LABEL[atomId] ?? atomId}: ${banked.join(', ')}`)
    }
    return lines.join('\n')
  }

  function buildCopyText() {
    return [
      `SENTENCE: ${genResult}`,
      ``,
      `TIER: ${tierObj ? tierObj.label : 'none selected'}`,
      `ACTIVE ATOMS: ${activeAtomIds.join(', ') || '—'}`,
      `WORDS USED: ${activeWordsList.join(', ') || '—'}`,
    ].join('\n')
  }

  function handleCopy() {
    navigator.clipboard.writeText(buildCopyText())
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
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

      <div className="im-tab-strip">
        <button className={`im-tab${tab === 'mirror' ? ' im-tab--active' : ''}`} onClick={() => setTab('mirror')}>Mirror</button>
        <button className={`im-tab${tab === 'layers' ? ' im-tab--active' : ''}`} onClick={() => setTab('layers')}>Layers</button>
      </div>

      {tab === 'layers' && (
        <InventoryMirrorLayersTab
          inventory={inventory}
          eligibleTiers={eligibleTiers}
          toggledOnAtoms={toggledOnAtoms}
        />
      )}

      {tab === 'mirror' && <>

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
                  <div key={atomId} className={`im-atom-row${!atomOn ? ' im-atom-row--off' : ''}`} onClick={() => toggleAtom(atomId)}>
                    <div className="im-atom-summary">
                      <span className="im-atom-check">{atomOn ? '☑' : '☐'}</span>
                      <span className={`im-atom-badge${atomOn ? ' im-atom-badge--on' : ''}`}>{label}</span>
                      <span className="im-split-learner">{banked.length} on</span>
                      <span className="im-split-divider">·</span>
                      <span className="im-split-ai">{restricted.length === 0 ? '✓' : `${restricted.length} off`}</span>
                      <button className="im-words-btn" onClick={e => { e.stopPropagation(); setWordsAtom(prev => prev === atomId ? null : atomId) }}>
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

        <div className="im-generate-section">
          <div className="im-generate-controls">
            <button className="im-generate-btn" onClick={handleGenerate}
              disabled={genState === 'loading' || activeWordsList.length === 0}>
              {genState === 'loading' ? 'generating…' : 'generate sentence'}
            </button>
            <span className="im-generate-meta">
              {tierObj ? tierObj.label : 'no tier selected'} · {activeWordsList.length} words active
            </span>
          </div>
          {genState === 'error' && <div className="im-generate-error">generation failed</div>}
          {genState === 'result' && genResult && (
            <div className="im-generate-result">
              <div className="im-generate-sentence">{genResult}</div>
              <div className="im-generate-info">
                <span className="im-generate-info-line">atoms: {activeAtomIds.map(a => PROMPT_LABEL[a] ?? a).join(', ') || '—'}</span>
                <span className="im-generate-info-line">words: {activeWordsList.join(', ')}</span>
              </div>
              <button className="im-copy-btn" onClick={handleCopy}>{copied ? 'copied ✓' : 'copy'}</button>
            </div>
          )}
        </div>

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
