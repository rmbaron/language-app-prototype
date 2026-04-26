import { useState, useMemo } from 'react'
import { useInventory } from './InventoryContext'
import { getStrings } from './uiStrings'
import { GRAMMAR_CLUSTERS } from './grammarClustering.en'
import { ATOMS } from './grammarAtoms.en'
import { getBankedWords } from './wordRegistry'
import { buildLearnerIntroduction } from './systemVocabulary'
import { checkCircuit, circuitSummary } from './circuitCheck'

const ATOM_BY_ID = Object.fromEntries(ATOMS.map(a => [a.id, a]))

const CLUSTER_SCOPE = {
  1: { sentences: '1 sentence',    structure: 'Subject + Verb · S + V + Object' },
  2: { sentences: '1–2 sentences', structure: '+ Description · Identity · Questions' },
  3: { sentences: '2–3 sentences', structure: '+ Connectors · Location · Time · Manner' },
  4: { sentences: '3–5 sentences', structure: '+ Modal · Negation · Progressive' },
}

const CLUSTER_FORCE = {
  1: 'The prompt must require a complete Subject + Verb + Object sentence.',
  2: 'The prompt must require the learner to use "be" (am/is/are) — to describe, identify, or locate something.',
  3: 'The prompt must require the learner to use a connector (and, but, because, or) or a question word (where, when, why, how).',
  4: "The prompt must require the learner to use a modal verb (can/can't/will), negation (don't/doesn't/not), or present progressive (am/is/are + -ing).",
}

// ─── Shared UI primitives ────────────────────────────────────────────────────

function Badge({ mode }) {
  const colors = {
    auto:     { bg: '#1a2a1a', color: '#4a8' },
    inferred: { bg: '#1a1a2a', color: '#48a' },
    manual:   { bg: '#2a1a1a', color: '#a84' },
    off:      { bg: '#1a1a1a', color: '#444' },
  }
  const c = colors[mode] ?? colors.off
  return (
    <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 3, background: c.bg, color: c.color, letterSpacing: '0.1em' }}>
      {mode.toUpperCase()}
    </span>
  )
}

function SlotOutput({ value }) {
  return (
    <div style={{ marginTop: 12, padding: '8px 10px', background: '#080808', borderRadius: 4, border: '1px solid #181818' }}>
      <div style={{ fontSize: 9, color: '#333', letterSpacing: '0.1em', marginBottom: 4 }}>SLOT OUTPUT</div>
      <pre style={{ margin: 0, fontSize: 11, color: '#555', fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{value || '(empty)'}</pre>
    </div>
  )
}

const rowBtn = (active) => ({
  textAlign: 'left', padding: '8px 10px', width: '100%',
  background: active ? '#141e14' : '#0d0d0d',
  border: `1px solid ${active ? '#2a3a2a' : '#181818'}`,
  borderRadius: 4, cursor: 'pointer',
})

const modeBtn = (active, scheme = 'green') => {
  const schemes = {
    green:  { bg: '#1a2a1a', border: '#2a4a2a', color: '#8c8' },
    blue:   { bg: '#1a1a2a', border: '#2a2a4a', color: '#88c' },
    red:    { bg: '#2a1a1a', border: '#4a2a2a', color: '#c88' },
    neutral:{ bg: '#1a1a1a', border: '#333',    color: '#888' },
  }
  const s = schemes[scheme] ?? schemes.neutral
  return {
    fontSize: 10, padding: '4px 10px', cursor: 'pointer', letterSpacing: '0.08em',
    background: active ? s.bg : '#0d0d0d',
    border: `1px solid ${active ? s.border : '#181818'}`,
    borderRadius: 3,
    color: active ? s.color : '#444',
  }
}

// ─── Tab 1: Grammar Target ───────────────────────────────────────────────────

function GrammarTargetTab({ activeAtoms, atomWords, targetAtomId, setTargetAtomId, difficulty, setDifficulty }) {
  const targetWords = atomWords[targetAtomId] ?? []
  const output = targetAtomId
    ? `Atom:       ${ATOM_BY_ID[targetAtomId]?.label ?? targetAtomId}\nWords:      ${targetWords.join(', ') || '(none banked)'}\nDifficulty: ${difficulty}`
    : '(no atom selected)'

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Badge mode="manual" />
        <span style={{ fontSize: 11, color: '#444' }}>Select target atom + difficulty level</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {activeAtoms.map(atomId => {
          const atom = ATOM_BY_ID[atomId]
          const words = atomWords[atomId] ?? []
          const active = targetAtomId === atomId
          return (
            <button key={atomId} onClick={() => setTargetAtomId(atomId)} style={rowBtn(active)}>
              <div style={{ fontSize: 12, color: active ? '#8c8' : '#666' }}>{atom?.label ?? atomId}</div>
              <div style={{ fontSize: 10, color: '#444', marginTop: 2 }}>{words.join(', ') || 'none banked'}</div>
            </button>
          )
        })}
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 9, color: '#333', letterSpacing: '0.1em', marginBottom: 6 }}>DIFFICULTY</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[1, 2, 3, 4].map(d => (
            <button key={d} onClick={() => setDifficulty(d)}
              style={{ width: 34, height: 34, ...modeBtn(difficulty === d), fontSize: 13, textAlign: 'center', padding: 0 }}>
              {d}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 6, fontSize: 10, color: '#333', lineHeight: 1.5 }}>
          {difficulty === 1 && 'Scaffolded — fill-in-the-blank style'}
          {difficulty === 2 && 'Partial — sentence starter given'}
          {difficulty === 3 && 'Open — topic only, no scaffolding'}
          {difficulty === 4 && 'Natural — no hint of target structure'}
        </div>
      </div>

      <SlotOutput value={output} />
    </div>
  )
}

// ─── Tab 2: Vocabulary Context ───────────────────────────────────────────────

function VocabularyContextTab({ topicClusters, selectedTopicKey, setSelectedTopicKey, vocabMode, setVocabMode }) {
  const sorted = Object.entries(topicClusters).sort((a, b) => b[1].length - a[1].length)
  const autoKey = sorted[0]?.[0] ?? null
  const effectiveKey = vocabMode === 'auto' ? autoKey : selectedTopicKey
  const selectedWords = effectiveKey ? (topicClusters[effectiveKey] ?? []) : []

  const output = effectiveKey
    ? `Topic: ${effectiveKey}\nWords: ${selectedWords.join(', ')}`
    : '(no topic selected)'

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        <button onClick={() => setVocabMode('auto')} style={modeBtn(vocabMode === 'auto', 'blue')}>AUTO</button>
        <button onClick={() => setVocabMode('user')} style={modeBtn(vocabMode === 'user', 'blue')}>USER SELECTS</button>
      </div>
      <div style={{ fontSize: 10, color: '#333', marginBottom: 10 }}>
        {vocabMode === 'auto' ? 'Largest cluster selected automatically.' : 'Tap a cluster to select it.'}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {sorted.map(([key, words]) => {
          const active = effectiveKey === key
          const dimmed = vocabMode === 'auto' && key !== autoKey
          return (
            <button key={key} onClick={() => { setVocabMode('user'); setSelectedTopicKey(key) }}
              style={{ ...rowBtn(active), opacity: dimmed ? 0.35 : 1 }}>
              <div style={{ fontSize: 12, color: active ? '#88c' : '#666' }}>
                {key} <span style={{ fontSize: 10, color: '#333' }}>({words.length})</span>
              </div>
              <div style={{ fontSize: 10, color: '#444', marginTop: 2 }}>{words.join(', ')}</div>
            </button>
          )
        })}
      </div>

      <SlotOutput value={output} />
    </div>
  )
}

// ─── Tab 3: Scope ────────────────────────────────────────────────────────────

function ScopeTab({ currentCluster, scope }) {
  const output = `Sentences: ${scope.sentences}\nStructure: ${scope.structure}\n\n(auto-derived from cluster ${currentCluster})`
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Badge mode="auto" />
        <span style={{ fontSize: 11, color: '#444' }}>Derived from cluster position</span>
      </div>

      {GRAMMAR_CLUSTERS.map(c => {
        const s = CLUSTER_SCOPE[c.id]
        if (!s) return null
        const active = c.id === currentCluster
        return (
          <div key={c.id} style={{ ...rowBtn(active), marginBottom: 5, cursor: 'default' }}>
            <div style={{ fontSize: 11, color: active ? '#8c8' : '#444' }}>C{c.id} — {s.sentences}</div>
            <div style={{ fontSize: 10, color: active ? '#556' : '#2a2a2a', marginTop: 2 }}>{s.structure}</div>
          </div>
        )
      })}

      <SlotOutput value={output} />
    </div>
  )
}

// ─── Tab 4: Force Instruction ────────────────────────────────────────────────

function ForceTab({ forceMode, setForceMode, autoForce, customForce, setCustomForce }) {
  const effective = forceMode === 'auto' ? autoForce : forceMode === 'manual' ? customForce : null
  const output = effective ?? '(none)'

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        <button onClick={() => setForceMode('auto')}   style={modeBtn(forceMode === 'auto',   'red')}>AUTO</button>
        <button onClick={() => setForceMode('manual')} style={modeBtn(forceMode === 'manual', 'red')}>MANUAL</button>
        <button onClick={() => setForceMode('off')}    style={modeBtn(forceMode === 'off',    'neutral')}>OFF</button>
      </div>

      {forceMode === 'auto' && (
        <div style={{ fontSize: 12, color: '#555', lineHeight: 1.6 }}>{autoForce ?? '(no force instruction for this cluster)'}</div>
      )}
      {forceMode === 'manual' && (
        <textarea value={customForce} onChange={e => setCustomForce(e.target.value)}
          placeholder="Describe the required structure the learner must use..."
          style={{ width: '100%', minHeight: 80, background: '#0d0d0d', border: '1px solid #222', borderRadius: 4, color: '#888', fontSize: 12, padding: '8px', resize: 'vertical', boxSizing: 'border-box' }} />
      )}
      {forceMode === 'off' && (
        <div style={{ fontSize: 12, color: '#333' }}>No structural requirement. Prompt is open-ended.</div>
      )}

      <SlotOutput value={output} />
    </div>
  )
}

// ─── Tab 5: Portrait ─────────────────────────────────────────────────────────

function PortraitTab() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Badge mode="auto" />
        <span style={{ fontSize: 11, color: '#444' }}>Grows from user expressions over time</span>
      </div>
      <div style={{ fontSize: 12, color: '#333', lineHeight: 1.7 }}>
        Portrait fragments accumulate here as the app learns who the user is through their writing and interactions. When present, they shape the prompt toward questions the app doesn't know the answer to yet.
      </div>
      <SlotOutput value="(empty — portrait not yet built)" />
    </div>
  )
}

// ─── Assembled Prompt Panel ──────────────────────────────────────────────────

function AssembledPromptPanel({ cefrLevel, targetAtomId, grammarContextWords, intersectionWords, difficulty, effectiveTopicKey, cappedTopicWords, scope, effectiveForce }) {
  const intersectNote = intersectionWords.length > 0 ? ` [${intersectionWords.length} intersect]` : ''
  const lines = [
    `LEVEL           ${cefrLevel ?? 'A1'}`,
    `GRAMMAR TARGET  ${targetAtomId ? `${ATOM_BY_ID[targetAtomId]?.label ?? targetAtomId} — ${grammarContextWords.join(', ') || 'none'}${intersectNote} — D${difficulty}` : '(none)'}`,
    `VOCABULARY      ${effectiveTopicKey ? `${effectiveTopicKey} — ${cappedTopicWords.join(', ')}` : '(none)'}`,
    `SCOPE           ${scope.sentences} · ${scope.structure}`,
    `FORCE           ${effectiveForce ?? '(none)'}`,
    `PORTRAIT        (empty)`,
  ].join('\n')

  return (
    <div style={{ margin: '16px 0', padding: '12px', background: '#080808', border: '1px solid #181818', borderRadius: 6 }}>
      <div style={{ fontSize: 9, color: '#2a2a2a', letterSpacing: '0.12em', marginBottom: 8 }}>ASSEMBLED PROMPT CONTEXT</div>
      <pre style={{ fontSize: 11, color: '#555', margin: 0, fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{lines}</pre>
    </div>
  )
}

// ─── Circuit display ─────────────────────────────────────────────────────────

function CircuitDisplay({ tokens }) {
  const summary = circuitSummary(tokens)
  const colors = { banked: '#4a8a4a', function: '#444', unknown: '#8a3030', punctuation: '#333' }

  return (
    <div style={{ marginTop: 12, padding: '12px', background: '#080808', border: '1px solid #181818', borderRadius: 6 }}>
      <div style={{ fontSize: 9, color: '#333', letterSpacing: '0.1em', marginBottom: 10 }}>CIRCUIT CHECK</div>
      <div style={{ lineHeight: 2.2, fontSize: 15 }}>
        {tokens.map((t, i) => (
          <span key={i} style={{
            color: colors[t.status],
            marginRight: t.status === 'punctuation' ? 0 : 5,
            textDecoration: t.status === 'unknown' ? 'underline dotted #8a3030' : 'none',
            fontWeight: t.status === 'banked' ? 500 : 400,
          }}>{t.word}</span>
        ))}
      </div>
      <div style={{ marginTop: 10, fontSize: 10, color: summary.clean ? '#4a8a4a' : '#6a4040', borderTop: '1px solid #181818', paddingTop: 8 }}>
        {summary.passed}/{summary.total} content words passed
        {summary.unknownWords.length > 0 && (
          <span style={{ color: '#8a3030' }}> · unknown: {summary.unknownWords.join(', ')}</span>
        )}
      </div>
      <div style={{ marginTop: 6, fontSize: 9, color: '#2a2a2a' }}>
        green = banked · dim = function word · red underline = not in bank
      </div>
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function WritingLab({ onBack }) {
  const { inventory } = useInventory()
  const s = getStrings(inventory.identity.interfaceLang)
  const { wordBank, identity, grammarPosition } = inventory
  const { atomWords, currentCluster, activeAtoms } = grammarPosition

  const [activeTab, setActiveTab] = useState('grammar')

  // Slot 1 — grammar target
  const [targetAtomId, setTargetAtomId] = useState(activeAtoms[0] ?? null)
  const [difficulty, setDifficulty]     = useState(1)

  // Slot 2 — vocabulary context (inferred from word bank semantic subtypes)
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
  const [vocabMode,        setVocabMode]        = useState('auto')
  const [selectedTopicKey, setSelectedTopicKey] = useState(null)

  // Slot 3 — scope (auto from cluster, overrideable for testing)
  const [scopeOverride, setScopeOverride] = useState(null)
  const scope = scopeOverride !== null ? (CLUSTER_SCOPE[scopeOverride] ?? CLUSTER_SCOPE[1]) : (CLUSTER_SCOPE[currentCluster] ?? CLUSTER_SCOPE[1])

  // Slot 4 — force instruction
  const [forceMode,    setForceMode]    = useState('auto')
  const [customForce,  setCustomForce]  = useState('')
  const autoForce      = CLUSTER_FORCE[currentCluster] ?? null
  const effectiveForce = forceMode === 'auto' ? autoForce : forceMode === 'manual' ? customForce : null

  // Derived assembled context
  const targetWords       = atomWords[targetAtomId] ?? []
  const sortedTopicKeys   = Object.entries(topicClusters).sort((a, b) => b[1].length - a[1].length)
  const autoTopicKey      = sortedTopicKeys[0]?.[0] ?? null
  const effectiveTopicKey = vocabMode === 'auto' ? autoTopicKey : selectedTopicKey
  const topicWords        = effectiveTopicKey ? (topicClusters[effectiveTopicKey] ?? []) : []

  // Intersection: words in both atom class and topic — these are the most relevant to send
  // Falls back to first N target words if intersection is thin
  const intersectionWords   = targetWords.filter(w => topicWords.includes(w))
  const grammarContextWords = intersectionWords.length >= 3
    ? intersectionWords.slice(0, 10)
    : [...new Set([...intersectionWords, ...targetWords])].slice(0, 10)
  const cappedTopicWords    = topicWords.slice(0, 15)

  // Generate state
  const [generatedPrompt, setGeneratedPrompt] = useState(null)
  const [userResponse,    setUserResponse]    = useState('')
  const [generating,      setGenerating]      = useState(false)
  const [error,           setError]           = useState(null)
  const [copied,          setCopied]          = useState(false)

  // Mirror AI + circuit state
  const [mirrorOutput,    setMirrorOutput]    = useState(null)
  const [circuitTokens,   setCircuitTokens]   = useState(null)
  const [mirrorLoading,   setMirrorLoading]   = useState(false)
  const [mirrorError,     setMirrorError]     = useState(null)

  // L3 test — CEFR level only, no inventory
  const [l3FreeOutput,    setL3FreeOutput]    = useState(null)
  const [l3AskOutput,     setL3AskOutput]     = useState(null)
  const [l3Loading,       setL3Loading]       = useState(null) // 'free' | 'ask' | null
  const [l3Error,         setL3Error]         = useState(null)

  // L4 free output (no L5 task — baseline comparison)
  const [freeOutput,      setFreeOutput]      = useState(null)
  const [freeLoading,     setFreeLoading]     = useState(false)
  const [freeError,       setFreeError]       = useState(null)

  // Custom L5 — freeform directive input
  const [customL5,        setCustomL5]        = useState('')
  const [customOutput,    setCustomOutput]    = useState(null)
  const [customTokens,    setCustomTokens]    = useState(null)
  const [customLoading,   setCustomLoading]   = useState(false)
  const [customError,     setCustomError]     = useState(null)

  async function handleGenerate() {
    if (!targetAtomId) return
    setGenerating(true); setError(null); setGeneratedPrompt(null); setUserResponse('')
    try {
      const res = await fetch('/__generate-writing-prompt-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetAtom:   { id: targetAtomId, label: ATOM_BY_ID[targetAtomId]?.label, words: grammarContextWords },
          activeAtoms:  activeAtoms.map(id => ({ id, label: ATOM_BY_ID[id]?.label, words: (atomWords[id] ?? []).slice(0, 8) })),
          vocabContext: { topic: effectiveTopicKey, words: cappedTopicWords },
          scope,
          difficulty,
          forceInstruction: effectiveForce,
          lang:      identity.lang,
          cefrLevel: identity.cefrLevel,
        }),
      })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error ?? 'Failed') }
      const data = await res.json()
      setGeneratedPrompt(data.prompt)
    } catch (e) { setError(e.message) }
    finally { setGenerating(false) }
  }

  const mirrorPromptBlock = [
    targetAtomId && `Grammar focus: ${ATOM_BY_ID[targetAtomId]?.label ?? targetAtomId}\nWords for this structure: ${grammarContextWords.join(', ') || '(none banked)'}`,
    effectiveTopicKey && `Vocabulary focus: ${effectiveTopicKey} — ${cappedTopicWords.join(', ')}`,
    `Scope: ${scope.sentences} · ${scope.structure}`,
    effectiveForce && `Required structure: ${effectiveForce}`,
  ].filter(Boolean).join('\n\n')

  const mirrorDirective = `Ask this person one question — something they can respond to in writing, in ${scope.sentences}. Natural and conversational. Not like a language exercise. One sentence only.`

  async function handleMirrorGenerate() {
    setMirrorLoading(true); setMirrorError(null); setMirrorOutput(null); setCircuitTokens(null)
    try {
      const res = await fetch('/__generate-layer-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode:            'l1l2l3l4',
          lang:            identity.lang,
          cefrLevel:       identity.cefrLevel,
          currentCluster,
          learnerBlock:    buildLearnerIntroduction(inventory),
          promptBlock:     mirrorPromptBlock,
          directiveOverride: mirrorDirective,
        }),
      })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error ?? 'Failed') }
      const data = await res.json()
      const output = data.sentence ?? data.text ?? ''
      setMirrorOutput(output)
      setCircuitTokens(checkCircuit(output, wordBank))
    } catch (e) { setMirrorError(e.message) }
    finally { setMirrorLoading(false) }
  }

  async function handleL3(type) {
    setL3Loading(type); setL3Error(null)
    if (type === 'free') setL3FreeOutput(null)
    else setL3AskOutput(null)
    try {
      const res = await fetch('/__generate-layer-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode:             'l1l2l3',
          lang:             identity.lang,
          cefrLevel:        identity.cefrLevel,
          currentCluster,
          learnerBlock:     buildLearnerIntroduction(inventory),
          directiveOverride: type === 'ask'
            ? 'Ask this person one question to write about. Just the question, one sentence.'
            : undefined,
        }),
      })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error ?? 'Failed') }
      const data = await res.json()
      const output = data.sentence ?? data.text ?? ''
      if (type === 'free') setL3FreeOutput(output)
      else setL3AskOutput(output)
    } catch (e) { setL3Error(e.message) }
    finally { setL3Loading(null) }
  }

  async function handleCustomL5() {
    if (!customL5.trim()) return
    setCustomLoading(true); setCustomError(null); setCustomOutput(null); setCustomTokens(null)
    try {
      const res = await fetch('/__generate-layer-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode:             'l1l2l3',
          lang:             identity.lang,
          cefrLevel:        identity.cefrLevel,
          currentCluster,
          learnerBlock:     buildLearnerIntroduction(inventory),
          directiveOverride: customL5.trim(),
        }),
      })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error ?? 'Failed') }
      const data = await res.json()
      const output = data.sentence ?? data.text ?? ''
      setCustomOutput(output)
      setCustomTokens(checkCircuit(output, wordBank))
    } catch (e) { setCustomError(e.message) }
    finally { setCustomLoading(false) }
  }

  async function handleFreeGenerate() {
    setFreeLoading(true); setFreeError(null); setFreeOutput(null)
    try {
      const res = await fetch('/__generate-layer-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode:         'l1l2l3l4',
          lang:         identity.lang,
          cefrLevel:    identity.cefrLevel,
          currentCluster,
          learnerBlock: buildLearnerIntroduction(inventory),
          promptBlock:  mirrorPromptBlock,
        }),
      })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error ?? 'Failed') }
      const data = await res.json()
      setFreeOutput(data.sentence ?? data.text ?? '')
    } catch (e) { setFreeError(e.message) }
    finally { setFreeLoading(false) }
  }

  const TABS     = ['grammar', 'vocabulary', 'force', 'portrait']
  const canGen   = !!targetAtomId && !generating
  const canSubmit = (userResponse ?? '').trim().length > 0

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 16px 60px', fontFamily: 'sans-serif', background: '#111', minHeight: '100vh', color: '#ccc' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#555', fontSize: 14, cursor: 'pointer', padding: 0 }}>{s.common.back}</button>
        <h2 style={{ margin: 0, fontSize: 16, color: '#888', fontWeight: 400, letterSpacing: '0.08em' }}>{s.writingLab.title}</h2>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ fontSize: 10, padding: '4px 10px', background: activeTab === tab ? '#1a1a1a' : 'none', border: `1px solid ${activeTab === tab ? '#333' : '#1a1a1a'}`, borderRadius: 3, color: activeTab === tab ? '#aaa' : '#444', cursor: 'pointer', letterSpacing: '0.08em' }}>
            {s.writingLab.tabs[tab]}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ marginBottom: 4 }}>
        {activeTab === 'grammar'    && <GrammarTargetTab    activeAtoms={activeAtoms} atomWords={atomWords} targetAtomId={targetAtomId} setTargetAtomId={setTargetAtomId} difficulty={difficulty} setDifficulty={setDifficulty} />}
        {activeTab === 'vocabulary' && <VocabularyContextTab topicClusters={topicClusters} selectedTopicKey={selectedTopicKey} setSelectedTopicKey={setSelectedTopicKey} vocabMode={vocabMode} setVocabMode={setVocabMode} />}
        {activeTab === 'scope'      && <ScopeTab            currentCluster={currentCluster} scope={scope} />}
        {activeTab === 'force'      && <ForceTab            forceMode={forceMode} setForceMode={setForceMode} autoForce={autoForce} customForce={customForce} setCustomForce={setCustomForce} />}
        {activeTab === 'portrait'   && <PortraitTab />}
      </div>

      {/* Assembled context — always visible */}
      <AssembledPromptPanel
        cefrLevel={identity.cefrLevel}
        targetAtomId={targetAtomId}
        grammarContextWords={grammarContextWords}
        intersectionWords={intersectionWords}
        difficulty={difficulty}
        effectiveTopicKey={effectiveTopicKey}
        cappedTopicWords={cappedTopicWords}
        scope={scope}
        effectiveForce={effectiveForce}
      />

      {/* Prompt going to Mirror AI — live preview */}
      <div style={{ margin: '0 0 10px', padding: '10px 12px', background: '#0c0c14', border: '1px solid #1e1e2e', borderRadius: 6 }}>
        <div style={{ fontSize: 9, color: '#3a3a5a', letterSpacing: '0.1em', marginBottom: 8 }}>PROMPT TO MIRROR AI</div>
        <pre style={{ margin: 0, fontSize: 11, color: '#666', fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
          {mirrorPromptBlock}{'\n\n'}<span style={{ color: '#4a4a7a' }}>{mirrorDirective}</span>
        </pre>
      </div>

      {/* Custom L5 — freeform directive */}
      <div style={{ margin: '0 0 10px', padding: '10px 12px', background: '#0c0c14', border: '1px solid #1e1e2e', borderRadius: 6 }}>
        <div style={{ fontSize: 9, color: '#3a3a5a', letterSpacing: '0.1em', marginBottom: 8 }}>CUSTOM L5 DIRECTIVE</div>
        <textarea
          value={customL5}
          onChange={e => setCustomL5(e.target.value)}
          placeholder="Type a directive to send as L5 — e.g. 'Write one sentence about something you want.'"
          style={{ width: '100%', minHeight: 70, background: '#080810', border: '1px solid #1a1a2a', borderRadius: 4, color: '#888', fontSize: 11, padding: '8px', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6, fontFamily: 'monospace' }}
        />
        <button
          onClick={handleCustomL5}
          disabled={!customL5.trim() || customLoading}
          style={{ marginTop: 8, width: '100%', padding: '8px', background: customL5.trim() && !customLoading ? '#0d0d1a' : '#0d0d0d', border: `1px solid ${customL5.trim() && !customLoading ? '#2a2a4a' : '#181818'}`, borderRadius: 4, color: customL5.trim() && !customLoading ? '#88c' : '#333', fontSize: 12, cursor: customL5.trim() && !customLoading ? 'pointer' : 'default', letterSpacing: '0.06em' }}>
          {customLoading ? 'sending...' : 'Send to Mirror AI'}
        </button>
        {customError && <p style={{ fontSize: 11, color: '#844', margin: '8px 0 0' }}>{customError}</p>}
        {customOutput && (
          <div style={{ marginTop: 10 }}>
            <div style={{ padding: '10px', background: '#080810', border: '1px solid #1a1a2a', borderRadius: 4, marginBottom: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ fontSize: 9, color: '#2a2a5a', letterSpacing: '0.1em' }}>OUTPUT</div>
                <button
                  onClick={() => {
                    const summary = circuitSummary(customTokens)
                    navigator.clipboard.writeText([
                      `L5: ${customL5.trim()}`,
                      `OUTPUT: ${customOutput}`,
                      `CIRCUIT: ${summary.passed}/${summary.total} passed`,
                      summary.unknownWords.length > 0 ? `UNKNOWN: ${summary.unknownWords.join(', ')}` : `UNKNOWN: none`,
                    ].join('\n'))
                  }}
                  style={{ fontSize: 9, padding: '2px 8px', background: 'none', border: '1px solid #2a2a4a', borderRadius: 3, color: '#444', cursor: 'pointer', letterSpacing: '0.08em' }}
                >copy</button>
              </div>
              <p style={{ margin: 0, fontSize: 14, color: '#bbb', lineHeight: 1.6 }}>{customOutput}</p>
            </div>
            <CircuitDisplay tokens={customTokens} />
          </div>
        )}
      </div>

      {/* Scope — interactive, overrideable */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 10px', padding: '6px 10px', background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 4, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 9, color: '#333', letterSpacing: '0.1em', flexShrink: 0 }}>SCOPE</span>
        {[1, 2, 3, 4].map(n => {
          const active = (scopeOverride ?? currentCluster) === n
          const isAuto = scopeOverride === null && n === currentCluster
          return (
            <button key={n} onClick={() => setScopeOverride(scopeOverride === n ? null : n)}
              style={{ fontSize: 9, padding: '2px 7px', borderRadius: 3, cursor: 'pointer', letterSpacing: '0.06em',
                background: active ? '#1a1a2a' : 'none',
                border: `1px solid ${active ? '#2a2a4a' : '#222'}`,
                color: active ? '#88c' : '#333' }}>
              C{n}{isAuto ? ' ·auto' : ''}
            </button>
          )
        })}
        <span style={{ fontSize: 10, color: '#444', marginLeft: 4 }}>{scope.sentences}</span>
        <span style={{ fontSize: 9, color: '#2a2a2a' }}>· {scope.structure}</span>
      </div>

      {/* Mirror AI — ask the cached AI using the assembled context as L5 */}
      <button
        onClick={handleMirrorGenerate}
        disabled={mirrorLoading}
        style={{ width: '100%', padding: '12px', background: mirrorLoading ? '#0d0d0d' : '#0d0d1a', border: `1px solid ${mirrorLoading ? '#181818' : '#2a2a4a'}`, borderRadius: 6, color: mirrorLoading ? '#333' : '#88c', fontSize: 14, cursor: mirrorLoading ? 'default' : 'pointer', letterSpacing: '0.06em', marginBottom: 10 }}>
        {mirrorLoading ? 'asking...' : 'Ask Mirror AI'}
      </button>

      {mirrorError && <p style={{ fontSize: 12, color: '#844', marginBottom: 10 }}>{mirrorError}</p>}

      {mirrorOutput && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ padding: '14px', background: '#0d0d1a', border: '1px solid #1a1a3a', borderRadius: 6, marginBottom: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 9, color: '#2a2a5a', letterSpacing: '0.1em' }}>MIRROR OUTPUT (raw)</div>
              <button
                onClick={() => {
                  const summary = circuitSummary(circuitTokens)
                  const text = [
                    `OUTPUT: ${mirrorOutput}`,
                    ``,
                    `CIRCUIT: ${summary.passed}/${summary.total} passed`,
                    summary.unknownWords.length > 0 ? `UNKNOWN: ${summary.unknownWords.join(', ')}` : `UNKNOWN: none`,
                  ].join('\n')
                  navigator.clipboard.writeText(text)
                }}
                style={{ fontSize: 9, padding: '2px 8px', background: 'none', border: '1px solid #2a2a4a', borderRadius: 3, color: '#444', cursor: 'pointer', letterSpacing: '0.08em' }}
              >copy</button>
            </div>
            <p style={{ margin: 0, fontSize: 15, color: '#bbb', lineHeight: 1.6 }}>{mirrorOutput}</p>
          </div>
          <CircuitDisplay tokens={circuitTokens} />
        </div>
      )}

      {/* L3 test — CEFR level only, no inventory */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 9, color: '#333', letterSpacing: '0.1em', marginBottom: 8 }}>L3 TEST (no inventory)</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button onClick={() => handleL3('free')} disabled={l3Loading !== null}
            style={{ flex: 1, padding: '9px', background: 'none', border: '1px solid #222', borderRadius: 5, color: l3Loading === 'free' ? '#333' : '#555', fontSize: 12, cursor: l3Loading ? 'default' : 'pointer', letterSpacing: '0.06em' }}>
            {l3Loading === 'free' ? 'generating...' : 'L3 free'}
          </button>
          <button onClick={() => handleL3('ask')} disabled={l3Loading !== null}
            style={{ flex: 1, padding: '9px', background: 'none', border: '1px solid #222', borderRadius: 5, color: l3Loading === 'ask' ? '#333' : '#555', fontSize: 12, cursor: l3Loading ? 'default' : 'pointer', letterSpacing: '0.06em' }}>
            {l3Loading === 'ask' ? 'generating...' : 'L3 ask'}
          </button>
        </div>
        {l3Error && <p style={{ fontSize: 11, color: '#844', margin: '0 0 8px' }}>{l3Error}</p>}
        {l3FreeOutput && (
          <div style={{ padding: '10px', background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 5, marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 9, color: '#333', letterSpacing: '0.1em' }}>L3 FREE</span>
              <button onClick={() => navigator.clipboard.writeText(l3FreeOutput)} style={{ fontSize: 9, padding: '2px 8px', background: 'none', border: '1px solid #222', borderRadius: 3, color: '#444', cursor: 'pointer' }}>copy</button>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#777', lineHeight: 1.6 }}>{l3FreeOutput}</p>
          </div>
        )}
        {l3AskOutput && (
          <div style={{ padding: '10px', background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 9, color: '#333', letterSpacing: '0.1em' }}>L3 ASK</span>
              <button onClick={() => navigator.clipboard.writeText(l3AskOutput)} style={{ fontSize: 9, padding: '2px 8px', background: 'none', border: '1px solid #222', borderRadius: 3, color: '#444', cursor: 'pointer' }}>copy</button>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#777', lineHeight: 1.6 }}>{l3AskOutput}</p>
          </div>
        )}
      </div>

      {/* L4 free — same stack, no writing task, baseline comparison */}
      <button
        onClick={handleFreeGenerate}
        disabled={freeLoading}
        style={{ width: '100%', padding: '10px', background: 'none', border: '1px solid #222', borderRadius: 6, color: freeLoading ? '#333' : '#555', fontSize: 13, cursor: freeLoading ? 'default' : 'pointer', letterSpacing: '0.06em', marginBottom: 10 }}>
        {freeLoading ? 'generating...' : 'L4 free (no task)'}
      </button>

      {freeError && <p style={{ fontSize: 12, color: '#844', marginBottom: 10 }}>{freeError}</p>}

      {freeOutput && (
        <div style={{ marginBottom: 16, padding: '12px', background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 9, color: '#333', letterSpacing: '0.1em' }}>L4 OUTPUT (no task)</div>
            <button
              onClick={() => navigator.clipboard.writeText(freeOutput)}
              style={{ fontSize: 9, padding: '2px 8px', background: 'none', border: '1px solid #222', borderRadius: 3, color: '#444', cursor: 'pointer', letterSpacing: '0.08em' }}
            >copy</button>
          </div>
          <p style={{ margin: 0, fontSize: 14, color: '#888', lineHeight: 1.6 }}>{freeOutput}</p>
        </div>
      )}

      <div style={{ height: 1, background: '#181818', margin: '4px 0 16px' }} />

      {/* Generate (original v2 endpoint — keep for comparison) */}
      <button onClick={handleGenerate} disabled={!canGen}
        style={{ width: '100%', padding: '12px', background: canGen ? '#1a2a1a' : '#0d0d0d', border: `1px solid ${canGen ? '#2a4a2a' : '#181818'}`, borderRadius: 6, color: canGen ? '#8c8' : '#333', fontSize: 14, cursor: canGen ? 'pointer' : 'default', letterSpacing: '0.06em', marginBottom: 16 }}>
        {generating ? s.writingLab.generating : `${s.writingLab.generate} (just from writing)`}
      </button>

      {error && <p style={{ fontSize: 12, color: '#844', marginBottom: 12 }}>{error}</p>}

      {/* Prompt + response */}
      {generatedPrompt && (
        <div>
          <div style={{ padding: '14px', background: '#0d150d', border: '1px solid #1a301a', borderRadius: 6, marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 9, color: '#2a4a2a', letterSpacing: '0.1em' }}>PROMPT</div>
              <button
                onClick={() => {
                  const lines = [
                    `CEFR: ${identity.cefrLevel ?? 'A1'}`,
                    `GRAMMAR TARGET: ${targetAtomId ? `${ATOM_BY_ID[targetAtomId]?.label ?? targetAtomId} (D${difficulty})` : '(none)'}`,
                    `TARGET WORDS: ${grammarContextWords.join(', ') || '(none)'}`,
                    `VOCABULARY: ${effectiveTopicKey ? `${effectiveTopicKey} — ${cappedTopicWords.join(', ')}` : '(none)'}`,
                    `SCOPE: ${scope.sentences} · ${scope.structure}`,
                    effectiveForce ? `FORCE: ${effectiveForce}` : null,
                    ``,
                    `PROMPT: ${generatedPrompt}`,
                  ].filter(l => l !== null).join('\n')
                  navigator.clipboard.writeText(lines)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }}
                style={{ fontSize: 9, padding: '2px 8px', background: 'none', border: '1px solid #2a4a2a', borderRadius: 3, color: copied ? '#8c8' : '#2a6a2a', cursor: 'pointer', letterSpacing: '0.08em' }}
              >
                {copied ? 'copied' : 'copy'}
              </button>
            </div>
            <p style={{ margin: 0, fontSize: 16, color: '#bbb', lineHeight: 1.6 }}>{generatedPrompt}</p>
          </div>
          <textarea
            value={userResponse}
            onChange={e => setUserResponse(e.target.value)}
            placeholder={s.writingLab.responsePlaceholder}
            style={{ width: '100%', minHeight: 120, background: '#0d0d0d', border: '1px solid #222', borderRadius: 6, color: '#999', fontSize: 14, padding: '12px', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 }}
          />
          <button
            onClick={() => {/* evaluation — TBD */}}
            disabled={!canSubmit}
            style={{ marginTop: 10, width: '100%', padding: '10px', background: canSubmit ? '#1a1a2a' : '#0d0d0d', border: `1px solid ${canSubmit ? '#2a2a4a' : '#181818'}`, borderRadius: 6, color: canSubmit ? '#88c' : '#333', fontSize: 13, cursor: canSubmit ? 'pointer' : 'default', letterSpacing: '0.06em' }}>
            {s.writingLab.submit}
          </button>
        </div>
      )}
    </div>
  )
}
