import { useState } from 'react'
import { useInventory } from './InventoryContext'
import { getStrings } from './uiStrings'
import { GRAMMAR_CLUSTERS } from './grammarClustering.en'
import { ATOMS } from './grammarAtoms.en'
import { buildLearnerIntroduction } from './systemVocabulary'

const ATOM_LABEL = Object.fromEntries(ATOMS.map(a => [a.id, a.label]))

function LayerTestPanel({ lang, learnerBlock }) {
  const [mode,    setMode]    = useState('l1')
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState(null)
  const [error,   setError]   = useState(null)
  const [copied,  setCopied]  = useState(false)

  const MODES = [
    { id: 'l1',      label: 'L1',       desc: 'AI speaks freely — no inventory' },
    { id: 'l1l2',    label: 'L1+L2',    desc: 'AI meets this world' },
    { id: 'l1l2l3',  label: 'L1+L2+L3', desc: 'Full stack with cluster constraint' },
  ]

  async function run() {
    setLoading(true); setResult(null); setError(null); setCopied(false)
    try {
      const res = await fetch('/__generate-layer-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, lang, learnerBlock: mode !== 'l1' ? learnerBlock : undefined, scope: 'sentence' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setResult(data.sentence ?? data.text ?? '')
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const btn = { fontSize: 10, padding: '3px 8px', border: '1px solid #333', borderRadius: 3, cursor: 'pointer' }

  return (
    <details style={{ margin: '16px 0', fontSize: 11, borderTop: '1px solid #222', paddingTop: 12 }}>
      <summary style={{ cursor: 'pointer', color: '#555', letterSpacing: '0.08em', userSelect: 'none' }}>DEV · Layer test</summary>
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {MODES.map(m => (
            <button key={m.id} onClick={() => setMode(m.id)} title={m.desc}
              style={{ ...btn, background: mode === m.id ? '#222' : 'none', color: mode === m.id ? '#aaa' : '#555' }}
            >{m.label}</button>
          ))}
        </div>
        <div style={{ fontSize: 10, color: '#444' }}>{MODES.find(m => m.id === mode)?.desc}</div>
        <button onClick={run} disabled={loading}
          style={{ alignSelf: 'flex-start', fontSize: 11, padding: '4px 12px', background: '#111', border: '1px solid #333', borderRadius: 3, color: loading ? '#444' : '#777', cursor: loading ? 'default' : 'pointer' }}
        >{loading ? '...' : 'generate'}</button>
        {error && <div style={{ fontSize: 10, color: '#844' }}>{error}</div>}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 13, color: '#bbb', lineHeight: 1.5 }}>{result}</div>
            <button onClick={() => { navigator.clipboard.writeText(`[${mode.toUpperCase()}] ${result}`); setCopied(true) }}
              style={{ alignSelf: 'flex-start', fontSize: 9, padding: '2px 6px', background: 'none', border: '1px solid #333', borderRadius: 3, color: copied ? '#8a8' : '#444', cursor: 'pointer' }}
            >{copied ? 'copied' : 'copy'}</button>
          </div>
        )}
      </div>
    </details>
  )
}

// Semantic topic taxonomy — word IDs mapped to topic labels.
// Only topics with at least one banked word surface in the picker.
// This makes the topic space structurally bounded by the inventory.
const TOPIC_MAP = {
  'Food & drink':       ['food', 'eat', 'drink', 'coffee', 'tea', 'water', 'bread'],
  'People':             ['friend', 'i', 'you', 'he', 'she', 'we', 'they', 'me'],
  'Feelings & wanting': ['love', 'like', 'hate', 'want', 'need', 'sorry', 'good'],
  'Daily life':         ['work', 'sleep', 'run', 'walk', 'play', 'open', 'close', 'get', 'go', 'come'],
  'Knowing & thinking': ['know', 'think', 'see', 'look', 'help'],
  'Communication':      ['speak', 'say', 'read', 'write', 'hello'],
  'Places & things':    ['house', 'room', 'here', 'bag', 'music', 'night'],
  'Having & giving':    ['have', 'give', 'take', 'make'],
}

const CLUSTER_SCOPE = {
  1: { sentences: '1 sentence',    structure: 'Subject + Verb · S + V + Object' },
  2: { sentences: '1–2 sentences', structure: '+ Description · Identity · Questions' },
  3: { sentences: '2–3 sentences', structure: '+ Connectors · Location · Time · Manner' },
  4: { sentences: '3–5 sentences', structure: '+ Modal · Negation · Progressive' },
}

// Per-cluster forced structure instruction — what the learner MUST use in their response.
// "any" mode allows these; "force" mode requires them.
const CLUSTER_FORCE = {
  1: 'The prompt must require a complete Subject + Verb + Object sentence.',
  2: 'The prompt must require the learner to use "be" (am/is/are) — to describe, identify, or locate something.',
  3: 'The prompt must require the learner to use a connector (and, but, because, or) or a question word (where, when, why, how).',
  4: 'The prompt must require the learner to use a modal verb (can/can\'t/will), negation (don\'t/doesn\'t/not), or present progressive (am/is/are + -ing).',
}

function deriveTopics(wordBank) {
  const banked = new Set(wordBank)
  return Object.entries(TOPIC_MAP)
    .map(([topic, words]) => ({ topic, words: words.filter(w => banked.has(w)) }))
    .filter(t => t.words.length > 0)
}

// TOTAL — the raw source: all banked words as pills
function WordBankPanel({ wordBank, s }) {
  return (
    <div className="wl-section">
      <span className="wl-section-label">{s.writingPractice.total}</span>
      <div className="wl-word-bank">
        {wordBank.length === 0
          ? <em className="wl-empty">{s.writingPractice.bankEmpty}</em>
          : wordBank.map(w => <span key={w} className="wl-word-pill">{w}</span>)
        }
      </div>
    </div>
  )
}

// GRAMMAR LAYER — cluster nav + toggleable atom rows, cumulative
function GrammarLayer({ atomWords, selectedCluster, setSelectedCluster, atomToggles, setAtomToggles, s }) {
  function isAtomOn(atomId) { return atomToggles[atomId] !== false }
  function toggleAtom(atomId) {
    setAtomToggles(prev => ({ ...prev, [atomId]: !isAtomOn(atomId) }))
  }

  const visibleClusters = GRAMMAR_CLUSTERS.filter(c => c.id <= selectedCluster)

  return (
    <div className="wl-section">
      <span className="wl-section-label">{s.writingPractice.grammar}</span>

      <div className="wl-cluster-nav">
        <div className="wl-cluster-btns">
          {GRAMMAR_CLUSTERS.map(c => (
            <button
              key={c.id}
              className={`wl-cluster-btn${selectedCluster === c.id ? ' wl-cluster-btn--active' : ''}`}
              onClick={() => setSelectedCluster(c.id)}
            >
              C{c.id}
            </button>
          ))}
        </div>
        <span className="wl-cluster-desc">
          {GRAMMAR_CLUSTERS.find(c => c.id === selectedCluster)?.description}
        </span>
      </div>

      <div className="wl-atom-sections">
        {visibleClusters.map(cluster => (
          <div key={cluster.id} className="wl-cluster-section">
            <div className="wl-cluster-section-header">
              <span className="wl-cluster-section-id">C{cluster.id}</span>
              <span className="wl-cluster-section-name">{cluster.label}</span>
            </div>
            <div className="wl-atom-rows">
              {cluster.atoms.map(atomId => {
                const words = atomWords[atomId] ?? []
                const on    = isAtomOn(atomId)
                return (
                  <div
                    key={atomId}
                    className={`wl-atom-row${on ? '' : ' wl-atom-row--off'}`}
                    onClick={() => toggleAtom(atomId)}
                  >
                    <span className="wl-atom-check">{on ? '☑' : '☐'}</span>
                    <span className="wl-atom-label">{ATOM_LABEL[atomId] ?? atomId}</span>
                    <span className="wl-atom-words">
                      {words.length > 0 ? words.join(', ') : <em>{s.writingPractice.atomNone}</em>}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// WHAT — topic cards, selectable; derived from word bank via TOPIC_MAP
function TopicPicker({ topics, activeTopicName, onSelectTopic, s }) {
  return (
    <div className="wl-section">
      <span className="wl-section-label">{s.writingPractice.what}</span>
      {topics.length === 0
        ? <em className="wl-empty">{s.writingPractice.noTopics}</em>
        : (
          <div className="wl-topic-grid">
            {topics.map(({ topic, words }) => (
              <button
                key={topic}
                className={`wl-topic-card${activeTopicName === topic ? ' wl-topic-card--active' : ''}`}
                onClick={() => onSelectTopic(topic)}
              >
                <span className="wl-topic-card-name">{topic}</span>
                <span className="wl-topic-card-words">{words.join(', ')}</span>
              </button>
            ))}
          </div>
        )
      }
    </div>
  )
}

// TO AI — equation panel showing exactly what goes to the generate endpoint
function EquationPanel({ selectedTopic, grammarWords, scope, s }) {
  return (
    <div className="wl-equation">
      <span className="wl-section-label">{s.writingPractice.toAi}</span>
      <div className="wl-eq-rows">
        <div className="wl-eq-row">
          <span className="wl-eq-label">{s.writingPractice.topicLabel}</span>
          <span className="wl-eq-value">
            {selectedTopic
              ? <><b>{selectedTopic.topic}</b> · {selectedTopic.words.join(', ')}</>
              : <em>—</em>}
          </span>
        </div>
        <div className="wl-eq-row">
          <span className="wl-eq-label">{s.writingPractice.grammarLabel}</span>
          <span className="wl-eq-value">
            {grammarWords.length > 0 ? grammarWords.join(', ') : <em>—</em>}
          </span>
        </div>
        <div className="wl-eq-row">
          <span className="wl-eq-label">{s.writingPractice.scopeLabel}</span>
          <span className="wl-eq-value">
            <b>{scope.sentences}</b>
            <span className="wl-eq-structure"> · {scope.structure}</span>
          </span>
        </div>
      </div>
    </div>
  )
}

export default function WritingPractice({ onBack }) {
  const { inventory } = useInventory()
  const s = getStrings(inventory.identity.interfaceLang)

  const { wordBank, identity, grammarPosition } = inventory
  const { atomWords, currentCluster } = grammarPosition

  const [selectedCluster,  setSelectedCluster]  = useState(currentCluster ?? 1)
  const [atomToggles,      setAtomToggles]       = useState({})
  const [selectedTopicName, setSelectedTopicName] = useState(null)
  const [generationState,  setGenerationState]   = useState('idle')
  const [generatedPrompt,  setGeneratedPrompt]   = useState(null)
  const [error,            setError]             = useState(null)

  function isAtomOn(atomId) { return atomToggles[atomId] !== false }

  const visibleClusters = GRAMMAR_CLUSTERS.filter(c => c.id <= selectedCluster)
  const activeAtomIds   = visibleClusters.flatMap(c => c.atoms).filter(isAtomOn)
  const grammarWords    = [...new Set(activeAtomIds.flatMap(id => atomWords[id] ?? []))]
  const availableTopics = deriveTopics(wordBank)
  // Fall back to first available topic if nothing explicitly selected
  const selectedTopic   = availableTopics.find(t => t.topic === selectedTopicName)
                       ?? availableTopics[0]
                       ?? null
  const scope           = CLUSTER_SCOPE[selectedCluster] ?? CLUSTER_SCOPE[1]

  async function handleGenerate(forced = false) {
    if (!selectedTopic) return
    setGenerationState(forced ? 'loading-forced' : 'loading')
    setError(null)

    const forceInstruction = forced ? (CLUSTER_FORCE[selectedCluster] ?? null) : null

    try {
      const res = await fetch('/__generate-writing-prompt', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedTopic,
          grammarWords,
          scope,
          lang:      identity.lang,
          cefrLevel: identity.cefrLevel,
          forceInstruction,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Generation failed')
      }

      const data = await res.json()
      setGeneratedPrompt(data.prompt)
      setGenerationState(forced ? 'result-forced' : 'result')
    } catch (err) {
      setError(err.message)
      setGenerationState('idle')
    }
  }

  const isLoading  = generationState === 'loading' || generationState === 'loading-forced'
  const canGenerate = wordBank.length > 0 && selectedTopic !== null && !isLoading

  return (
    <div className="wl-screen">
      <div className="wl-header">
        <button className="back-btn" onClick={onBack}>{s.common.back}</button>
        <h2 className="wl-title">{s.writingPractice.title}</h2>
      </div>

      <WordBankPanel wordBank={wordBank} s={s} />

      <GrammarLayer
        atomWords={atomWords}
        selectedCluster={selectedCluster}
        setSelectedCluster={setSelectedCluster}
        atomToggles={atomToggles}
        setAtomToggles={setAtomToggles}
        s={s}
      />

      <TopicPicker
        topics={availableTopics}
        activeTopicName={selectedTopic?.topic ?? null}
        onSelectTopic={setSelectedTopicName}
        s={s}
      />

      <EquationPanel
        selectedTopic={selectedTopic}
        grammarWords={grammarWords}
        scope={scope}
        s={s}
      />

      <LayerTestPanel lang={identity.lang} learnerBlock={buildLearnerIntroduction(inventory)} />

      <div className="wl-generate-section">
        <div className="wl-generate-btns">
          <button
            className="wl-generate-btn"
            onClick={() => handleGenerate(false)}
            disabled={!canGenerate}
          >
            {generationState === 'loading' ? s.writingPractice.generating : s.writingPractice.generate}
          </button>
          <button
            className="wl-generate-btn wl-generate-btn--force"
            onClick={() => handleGenerate(true)}
            disabled={!canGenerate}
          >
            {generationState === 'loading-forced' ? s.writingPractice.generating : `force C${selectedCluster}`}
          </button>
        </div>

        {error && <p className="wl-error">{error}</p>}

        {(generationState === 'result' || generationState === 'result-forced') && generatedPrompt && (
          <div className="wl-result">
            <div className="wl-result-header">
              <span className="wl-result-label">{s.writingPractice.result}</span>
              <button
                className="wl-copy-btn"
                onClick={() => {
                  const clusterDesc = GRAMMAR_CLUSTERS.find(c => c.id === selectedCluster)?.description ?? ''
                  const atomLines = visibleClusters.flatMap(c =>
                    c.atoms.map(atomId => {
                      const on    = atomToggles[atomId] !== false
                      const words = atomWords[atomId] ?? []
                      return `  ${on ? '☑' : '☐'} ${ATOM_LABEL[atomId] ?? atomId}: ${words.join(', ') || 'none banked'}`
                    })
                  )
                  const isForced = generationState === 'result-forced'
                  const text = [
                    `MODE: ${isForced ? `force C${selectedCluster}` : 'any'}`,
                    `CLUSTER: C${selectedCluster} — ${clusterDesc}`,
                    `ATOMS:`,
                    ...atomLines,
                    ``,
                    `TOPIC: ${selectedTopic?.topic} — ${selectedTopic?.words.join(', ')}`,
                    `GRAMMAR: ${grammarWords.join(', ') || '—'}`,
                    `SCOPE: ${scope.sentences} · ${scope.structure}`,
                    ...(isForced ? [`FORCED: ${CLUSTER_FORCE[selectedCluster]}`] : []),
                    ``,
                    `PROMPT: ${generatedPrompt}`,
                  ].join('\n')
                  navigator.clipboard.writeText(text)
                }}
              >
                copy
              </button>
            </div>
            <p className="wl-result-text">{generatedPrompt}</p>
          </div>
        )}
      </div>
    </div>
  )
}
