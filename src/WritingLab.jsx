import { useState, useMemo } from 'react'
import { useInventory } from './InventoryContext'
import { getStrings } from './uiStrings'
import { GRAMMAR_CLUSTERS } from './grammarClustering.en'
import { CONSTRUCTOR_TIERS } from './constructorTiers.en.js'
import { ATOMS } from './grammarAtoms.en'
import { getBankedWords } from './wordRegistry'
import { buildLearnerIntroduction, buildLevelChannel } from './systemVocabulary'
import { buildAISystemPrompt } from './aiIdentity'
import { checkCircuit, circuitSummary, checkCircuitFull, splitSentences } from './circuitCheck'

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

// ─── Theme ───────────────────────────────────────────────────────────────────

const T = {
  page:       '#d8d8da',
  card:       '#e8e8ea',
  border:     '#c4c4c6',
  borderHi:   '#aaaaac',
  text:       '#1a1a1a',
  textSub:    '#444',
  textDim:    '#777',
  textFaint:  '#999',
  label:      '#666',
  codeBg:     '#d0d0d2',
  codeText:   '#222',
  green:      '#1a5a1a',
  greenBg:    '#d8eed8',
  greenBord:  '#90c090',
  blue:       '#1a2a7a',
  blueBg:     '#d8e0f4',
  blueBord:   '#90a8d8',
  purple:     '#4a2a8a',
  purpleBg:   '#e0d8f4',
  purpleBord: '#a890d8',
  red:        '#7a1a1a',
  redBg:      '#f0d8d8',
  redBord:    '#d09090',
  layerTag:   '#1a5a1a',
}

const btn = (variant = 'default', active = false) => {
  const variants = {
    default: { bg: '#fff', bord: T.border, color: T.textSub },
    green:   { bg: active ? T.greenBg  : '#fff', bord: active ? T.greenBord  : T.border, color: active ? T.green  : T.textSub },
    blue:    { bg: active ? T.blueBg   : '#fff', bord: active ? T.blueBord   : T.border, color: active ? T.blue   : T.textSub },
    purple:  { bg: active ? T.purpleBg : '#fff', bord: active ? T.purpleBord : T.border, color: active ? T.purple : T.textSub },
    red:     { bg: active ? T.redBg    : '#fff', bord: active ? T.redBord    : T.border, color: active ? T.red    : T.textSub },
  }
  const v = variants[variant] ?? variants.default
  return { background: v.bg, border: `1px solid ${v.bord}`, borderRadius: 4, color: v.color, cursor: 'pointer', fontSize: 12, padding: '5px 12px' }
}

// ─── Shared UI primitives ────────────────────────────────────────────────────

function Label({ children }) {
  return <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: T.label, textTransform: 'uppercase', marginBottom: 8 }}>{children}</div>
}

function SlotOutput({ value }) {
  return (
    <div style={{ marginTop: 10, padding: '10px 12px', background: T.codeBg, borderRadius: 4, border: `1px solid ${T.border}` }}>
      <Label>Slot Output</Label>
      <pre style={{ margin: 0, fontSize: 12, color: T.codeText, fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{value || '(empty)'}</pre>
    </div>
  )
}

const rowBtn = (active) => ({
  textAlign: 'left', padding: '10px 12px', width: '100%',
  background: active ? T.greenBg : T.card,
  border: `1px solid ${active ? T.greenBord : T.border}`,
  borderRadius: 4, cursor: 'pointer', marginBottom: 4,
})

const modeBtn = (active, variant = 'green') => {
  const map = { green: 'green', blue: 'blue', red: 'red', neutral: 'default' }
  return { ...btn(map[variant] ?? 'default', active), fontSize: 11, padding: '4px 10px' }
}

// ─── Tab 1: Grammar Target ───────────────────────────────────────────────────

function GrammarTargetTab({ activeAtoms, atomWords, targetAtomIds, setTargetAtomIds, difficulty, setDifficulty }) {
  const activeSet = new Set(activeAtoms)
  const firstCluster = GRAMMAR_CLUSTERS.find(c => c.atoms.some(id => targetAtomIds.has(id)))?.id ?? GRAMMAR_CLUSTERS[0]?.id
  const [selectedCluster, setSelectedCluster] = useState(firstCluster)

  const visibleClusters = GRAMMAR_CLUSTERS.filter(c => c.atoms.some(id => activeSet.has(id)))
  const cluster = visibleClusters.find(c => c.id === selectedCluster) ?? visibleClusters[0]
  const tiers = cluster ? CONSTRUCTOR_TIERS.filter(t => t.band === cluster.id) : []
  const tieredAtomIds = new Set(tiers.flatMap(t => t.atoms))

  function toggleAtom(atomId) {
    setTargetAtomIds(prev => {
      const next = new Set(prev)
      next.has(atomId) ? next.delete(atomId) : next.add(atomId)
      return next
    })
  }

  function toggleCluster(c) {
    const clusterActive = c.atoms.filter(id => activeSet.has(id))
    const allOn = clusterActive.every(id => targetAtomIds.has(id))
    setTargetAtomIds(prev => {
      const next = new Set(prev)
      allOn ? clusterActive.forEach(id => next.delete(id)) : clusterActive.forEach(id => next.add(id))
      return next
    })
  }

  const output = targetAtomIds.size > 0
    ? [...targetAtomIds].map(id => `● ${ATOM_BY_ID[id]?.label ?? id}: ${(atomWords[id] ?? []).join(', ') || 'none banked'}`).join('\n')
    : '(no atoms selected)'

  function AtomBtn({ atomId }) {
    const atom = ATOM_BY_ID[atomId]
    const words = atomWords[atomId] ?? []
    const on = targetAtomIds.has(atomId)
    return (
      <button onClick={() => toggleAtom(atomId)}
        style={{ display: 'flex', gap: 10, alignItems: 'baseline', width: '100%', textAlign: 'left', padding: '4px 8px', marginBottom: 2, cursor: 'pointer', borderRadius: 3,
          border: `1px solid ${on ? T.greenBord : T.border}`,
          background: on ? T.greenBg : T.page }}>
        <span style={{ fontSize: 8, color: on ? T.green : T.textDim }}>●</span>
        <span style={{ color: on ? T.green : T.text, fontWeight: on ? 700 : 400, width: 160 }}>{atom?.label ?? atomId}</span>
        <span style={{ color: T.textDim, fontSize: 11 }}>{words.slice(0, 4).join(', ') || 'none banked'}</span>
      </button>
    )
  }

  return (
    <div>
      {/* Horizontal cluster selector + toggle */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
        {visibleClusters.map(c => {
          const clusterActive = c.atoms.filter(id => activeSet.has(id))
          const allOn = clusterActive.length > 0 && clusterActive.every(id => targetAtomIds.has(id))
          const someOn = clusterActive.some(id => targetAtomIds.has(id))
          return (
            <div key={c.id} style={{ display: 'flex', gap: 0 }}>
              <button onClick={() => setSelectedCluster(c.id)}
                style={{ fontFamily: 'monospace', fontSize: 11, padding: '3px 8px', border: `1px solid ${T.border}`, borderRight: 'none', borderRadius: '3px 0 0 3px', cursor: 'pointer',
                  background: selectedCluster === c.id ? T.blueBg : T.card,
                  color: selectedCluster === c.id ? T.blue : T.textDim,
                  fontWeight: selectedCluster === c.id ? 700 : 400 }}>
                C{c.id}
              </button>
              <button onClick={() => toggleCluster(c)}
                style={{ fontFamily: 'monospace', fontSize: 10, padding: '3px 6px', border: `1px solid ${T.border}`, borderRadius: '0 3px 3px 0', cursor: 'pointer',
                  background: allOn ? T.greenBg : someOn ? '#e8f4e8' : T.card,
                  color: allOn ? T.green : someOn ? T.green : T.textDim }}>
                {allOn ? '✓' : someOn ? '–' : '+'}
              </button>
            </div>
          )
        })}
      </div>

      {/* Compact atom list — Profiles style */}
      {cluster && (
        <div style={{ fontFamily: 'monospace', fontSize: 12 }}>
          <div style={{ color: T.layerTag, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, paddingBottom: 4, borderBottom: `1px solid ${T.border}` }}>
            C{cluster.id} — {cluster.label}
          </div>
          {tiers.map(tier => {
            const tierActiveAtoms = tier.atoms.filter(id => activeSet.has(id))
            if (tierActiveAtoms.length === 0) return null
            return (
              <div key={tier.id} style={{ marginBottom: 8 }}>
                <div style={{ color: T.textDim, fontSize: 11, marginBottom: 3, paddingLeft: 4 }}>{tier.label}</div>
                <div style={{ paddingLeft: 12 }}>
                  {tierActiveAtoms.map(atomId => <AtomBtn key={atomId} atomId={atomId} />)}
                </div>
              </div>
            )
          })}
          {cluster.atoms.filter(id => activeSet.has(id) && !tieredAtomIds.has(id)).map(atomId => (
            <AtomBtn key={atomId} atomId={atomId} />
          ))}
        </div>
      )}


      <div style={{ marginTop: 16 }}>
        <Label>Difficulty</Label>
        <div style={{ display: 'flex', gap: 6 }}>
          {[1, 2, 3, 4].map(d => (
            <button key={d} onClick={() => setDifficulty(d)}
              style={{ ...btn('green', difficulty === d), width: 36, height: 36, padding: 0, fontSize: 14, textAlign: 'center' }}>
              {d}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: T.textSub }}>
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
  const output = effectiveKey ? `Topic: ${effectiveKey}\nWords: ${selectedWords.join(', ')}` : '(no topic selected)'

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <button onClick={() => setVocabMode('auto')} style={modeBtn(vocabMode === 'auto', 'blue')}>AUTO</button>
        <button onClick={() => setVocabMode('user')} style={modeBtn(vocabMode === 'user', 'blue')}>USER SELECTS</button>
      </div>
      <p style={{ margin: '0 0 12px', fontSize: 12, color: T.textDim }}>
        {vocabMode === 'auto' ? 'Largest cluster selected automatically.' : 'Tap a cluster to select it.'}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {sorted.map(([key, words]) => {
          const active = effectiveKey === key
          const dimmed = vocabMode === 'auto' && key !== autoKey
          return (
            <button key={key} onClick={() => { setVocabMode('user'); setSelectedTopicKey(key) }}
              style={{ ...rowBtn(active), opacity: dimmed ? 0.4 : 1 }}>
              <div style={{ fontSize: 13, color: active ? T.blue : T.text }}>
                {key} <span style={{ fontSize: 11, color: T.textDim }}>({words.length})</span>
              </div>
              <div style={{ fontSize: 11, color: T.textDim, marginTop: 2 }}>{words.join(', ')}</div>
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
      <p style={{ margin: '0 0 12px', fontSize: 12, color: T.textSub }}>Derived from cluster position</p>
      {GRAMMAR_CLUSTERS.map(c => {
        const s = CLUSTER_SCOPE[c.id]
        if (!s) return null
        const active = c.id === currentCluster
        return (
          <div key={c.id} style={{ ...rowBtn(active), cursor: 'default', marginBottom: 4 }}>
            <div style={{ fontSize: 13, color: active ? T.green : T.text }}>C{c.id} — {s.sentences}</div>
            <div style={{ fontSize: 11, color: T.textDim, marginTop: 2 }}>{s.structure}</div>
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

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        <button onClick={() => setForceMode('auto')}   style={modeBtn(forceMode === 'auto',   'red')}>AUTO</button>
        <button onClick={() => setForceMode('manual')} style={modeBtn(forceMode === 'manual', 'red')}>MANUAL</button>
        <button onClick={() => setForceMode('off')}    style={modeBtn(forceMode === 'off',    'neutral')}>OFF</button>
      </div>

      {forceMode === 'auto' && (
        <p style={{ margin: 0, fontSize: 13, color: T.textSub, lineHeight: 1.6 }}>{autoForce ?? '(no force instruction for this cluster)'}</p>
      )}
      {forceMode === 'manual' && (
        <textarea value={customForce} onChange={e => setCustomForce(e.target.value)}
          placeholder="Describe the required structure the learner must use..."
          style={{ width: '100%', minHeight: 80, background: T.card, border: `1px solid ${T.border}`, borderRadius: 4, color: T.text, fontSize: 13, padding: '8px 10px', resize: 'vertical', boxSizing: 'border-box' }} />
      )}
      {forceMode === 'off' && (
        <p style={{ margin: 0, fontSize: 13, color: T.textDim }}>No structural requirement. Prompt is open-ended.</p>
      )}

      <SlotOutput value={effective ?? '(none)'} />
    </div>
  )
}

// ─── Tab 5: Portrait ─────────────────────────────────────────────────────────

function PortraitTab() {
  return (
    <div>
      <p style={{ margin: '0 0 12px', fontSize: 13, color: T.textSub, lineHeight: 1.7 }}>
        Portrait fragments accumulate here as the app learns who the user is through their writing and interactions.
      </p>
      <SlotOutput value="(empty — portrait not yet built)" />
    </div>
  )
}

// ─── Assembled Prompt Panel ──────────────────────────────────────────────────

function AssembledPromptPanel({ cefrLevel, worldTexture, scope, effectiveForce, difficulty }) {
  const lines = [
    `LEVEL     ${cefrLevel ?? 'A1'}`,
    `SCOPE     ${scope.sentences} · ${scope.structure}`,
    effectiveForce && `FORCE     ${effectiveForce}`,
    `D         ${difficulty}`,
    ``,
    `WORLD TEXTURE:`,
    worldTexture || '(nothing banked yet)',
  ].filter(l => l !== undefined).join('\n')

  return (
    <div style={{ margin: '14px 0 10px', padding: '12px 14px', background: T.codeBg, border: `1px solid ${T.border}`, borderRadius: 5 }}>
      <Label>Assembled Context</Label>
      <pre style={{ fontSize: 12, color: T.codeText, margin: 0, fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{lines}</pre>
    </div>
  )
}

// ─── Circuit display ─────────────────────────────────────────────────────────

const CIRCUIT_STYLE = {
  fixed_unit:   { bg: '#e8d8f4', border: '#b890d8', color: '#4a1a8a', label: 'unit'         },
  construction: { bg: '#fde8c8', border: '#d8a050', color: '#7a4000', label: 'construction' },
  banked:       { bg: T.greenBg,  border: T.greenBord,  color: T.green,   label: 'banked'  },
  function:     { bg: T.card,     border: T.border,      color: T.textDim, label: 'fn'      },
  unknown:      { bg: T.redBg,    border: T.redBord,     color: T.red,     label: '?'       },
  punctuation:  { bg: 'transparent', border: 'transparent', color: T.textDim, label: ''    },
}

function CircuitDisplay({ tokens }) {
  const nonPunct = tokens.filter(t => t.type !== 'punctuation')
  const unknown  = nonPunct.filter(t => t.type === 'unknown')
  const passed   = nonPunct.length - unknown.length
  const clean    = unknown.length === 0

  return (
    <div style={{ marginTop: 12, padding: '12px 14px', background: T.codeBg, border: `1px solid ${T.border}`, borderRadius: 5 }}>
      <Label>Circuit Check</Label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-end', marginBottom: 10 }}>
        {tokens.map((t, i) => {
          const s = CIRCUIT_STYLE[t.type] ?? CIRCUIT_STYLE.unknown
          if (t.type === 'punctuation') return (
            <span key={i} style={{ color: T.textDim, fontSize: 18, paddingBottom: 18 }}>{t.surface}</span>
          )
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <div style={{ padding: '6px 12px', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 5, color: s.color, fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap' }}>
                {t.surface}
              </div>
              <span style={{ fontSize: 9, color: s.color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{t.atomClass ?? s.label}</span>
            </div>
          )
        })}
      </div>
      <div style={{ fontSize: 12, color: clean ? T.green : T.red, borderTop: `1px solid ${T.border}`, paddingTop: 8 }}>
        {passed}/{nonPunct.length} passed
        {unknown.length > 0 && <span style={{ color: T.red }}> · unknown: {unknown.map(t => t.surface).join(', ')}</span>}
      </div>
    </div>
  )
}

// ─── Sentence circuit display ────────────────────────────────────────────────

function SentenceCircuitDisplay({ text, wordBank, wordTokens }) {
  const sentences = splitSentences(text)
  if (sentences.length === 0) return null

  const wordCircuitCount = wordTokens
    ? new Set(wordTokens.map(t => t.sentenceIndex ?? 1)).size
    : null
  const sentenceCount = sentences.length
  const aligned = wordCircuitCount === null || wordCircuitCount === sentenceCount

  return (
    <div style={{ marginTop: 8, padding: '10px 12px', background: T.codeBg, border: `1px solid ${T.border}`, borderRadius: 5 }}>
      <Label>Sentence Circuit</Label>
      {sentences.map(s => {
        const tokens  = checkCircuit(s.text, wordBank)
        const summary = circuitSummary(tokens)
        return (
          <div key={s.index} style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 5 }}>
            <span style={{ fontSize: 10, fontFamily: 'monospace', color: T.textDim, flexShrink: 0, width: 18 }}>S{s.index}</span>
            <span style={{ fontSize: 13, color: summary.clean ? T.green : T.red, flex: 1, lineHeight: 1.5 }}>
              {s.text}{s.terminator ?? ''}
            </span>
            <span style={{ fontSize: 11, color: T.textDim, flexShrink: 0, whiteSpace: 'nowrap' }}>
              {summary.passed}/{summary.total}
              {!summary.clean && ` · ${summary.unknownWords.join(', ')}`}
            </span>
          </div>
        )
      })}
      <div style={{ fontSize: 11, color: aligned ? T.green : T.red, borderTop: `1px solid ${T.border}`, paddingTop: 6, marginTop: 4 }}>
        {aligned
          ? `✓ both circuits agree: ${sentenceCount} sentence${sentenceCount !== 1 ? 's' : ''}`
          : `✗ mismatch — sentence circuit: ${sentenceCount}, word circuit: ${wordCircuitCount}`}
      </div>
    </div>
  )
}

// ─── Layer section wrapper ───────────────────────────────────────────────────

function LayerSection({ id, label, onGenerate, loading, prompt, showPrompt, onTogglePrompt, hasOutput, showOutput, onToggleOutput, children }) {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div style={{ marginBottom: 3, border: `1px solid ${T.border}`, borderRadius: 6, overflow: 'hidden', background: T.card }}>
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: '#dcdcde', borderBottom: collapsed ? 'none' : `1px solid ${T.border}` }}>
        <button onClick={() => setCollapsed(p => !p)}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 10, color: T.textDim, flexShrink: 0, lineHeight: 1 }}>
          {collapsed ? '▶' : '▼'}
        </button>
        <span style={{ fontFamily: 'monospace', fontSize: 13, color: T.layerTag, fontWeight: 700, flexShrink: 0 }}>{id}{label && <span style={{ fontWeight: 400, color: T.textDim }}> — {label}</span>}</span>
        <div style={{ flex: 1 }} />
        {!collapsed && onGenerate && (
          <button onClick={onGenerate} disabled={loading}
            style={{ ...btn('green', false), opacity: loading ? 0.5 : 1, cursor: loading ? 'default' : 'pointer', fontSize: 12, padding: '4px 14px' }}>
            {loading ? 'generating…' : 'generate'}
          </button>
        )}
        {!collapsed && (
          <button onClick={onTogglePrompt}
            style={{ ...btn('default', showPrompt), fontSize: 11, padding: '3px 10px' }}>
            {showPrompt ? 'hide prompt' : 'prompt'}
          </button>
        )}
        {!collapsed && hasOutput && (
          <button onClick={onToggleOutput}
            style={{ ...btn('default', showOutput), fontSize: 11, padding: '3px 10px' }}>
            {showOutput ? 'hide output' : 'output'}
          </button>
        )}
      </div>

      {!collapsed && <>
        {/* Prompt */}
        {showPrompt && prompt && (
          <div style={{ borderBottom: `1px solid ${T.border}` }}>
            <div style={{ padding: '6px 14px 4px', background: '#d4cfc0' }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: '#b07030', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Prompt</span>
            </div>
            <pre style={{ margin: 0, padding: '12px 14px', fontSize: 12, color: '#444', fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: 1.7, background: '#d4cfc0' }}>
              {prompt}
            </pre>
          </div>
        )}
        {children}
      </>}
    </div>
  )
}

// ─── Output block ─────────────────────────────────────────────────────────────

function OutputBlock({ label, text, onCopy }) {
  return (
    <div style={{ padding: '12px 14px', borderTop: `1px solid ${T.border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: T.label, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label ?? 'Output'}</span>
        {onCopy && <button onClick={onCopy} style={{ ...btn(), fontSize: 11, padding: '2px 10px' }}>copy</button>}
      </div>
      <p style={{ margin: 0, fontSize: 16, color: T.text, lineHeight: 1.7 }}>{text}</p>
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
  const [targetAtomIds, setTargetAtomIds] = useState(() => new Set(activeAtoms.slice(0, 1)))
  const [difficulty, setDifficulty]     = useState(1)

  // Slot 2 — vocabulary context
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

  // Slot 3 — scope
  const [scopeOverride, setScopeOverride] = useState(null)
  const scope = scopeOverride !== null ? (CLUSTER_SCOPE[scopeOverride] ?? CLUSTER_SCOPE[1]) : (CLUSTER_SCOPE[currentCluster] ?? CLUSTER_SCOPE[1])

  // Slot 4 — force
  const [forceMode,   setForceMode]   = useState('auto')
  const [customForce, setCustomForce] = useState('')
  const autoForce      = CLUSTER_FORCE[currentCluster] ?? null
  const effectiveForce = forceMode === 'auto' ? autoForce : forceMode === 'manual' ? customForce : null

  // Derived context
  const targetWords       = [...targetAtomIds].flatMap(id => atomWords[id] ?? [])
  const sortedTopicKeys   = Object.entries(topicClusters).sort((a, b) => b[1].length - a[1].length)
  const autoTopicKey      = sortedTopicKeys[0]?.[0] ?? null
  const effectiveTopicKey = vocabMode === 'auto' ? autoTopicKey : selectedTopicKey
  const topicWords        = effectiveTopicKey ? (topicClusters[effectiveTopicKey] ?? []) : []
  const intersectionWords   = targetWords.filter(w => topicWords.includes(w))
  const grammarContextWords = intersectionWords.length >= 3
    ? intersectionWords.slice(0, 10)
    : [...new Set([...intersectionWords, ...targetWords])].slice(0, 10)
  const cappedTopicWords = topicWords.slice(0, 15)

  // World texture — L4 framing
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

    const clusterData = GRAMMAR_CLUSTERS.find(c => c.id === currentCluster)
    const topTier = CONSTRUCTOR_TIERS.filter(t => t.band <= currentCluster).slice(-1)[0]
    if (topTier) {
      lines.push(`What their sentences can hold: ${topTier.examples.slice(0, 3).join(' / ')}`)
    }

    if (effectiveTopicKey && cappedTopicWords.length > 0) {
      lines.push(`The conversation is moving through: ${effectiveTopicKey} — ${cappedTopicWords.join(', ')}`)
    }

    return lines.join('\n')
  }, [atomWords, targetAtomIds, currentCluster, effectiveTopicKey, cappedTopicWords])

  // Portrait state
  const [quantOn,     setQuantOn]     = useState(false)
  const [qualOn,      setQualOn]      = useState(false)
  const [quantText,   setQuantText]   = useState('')
  const [qualText,    setQualText]    = useState('')
  const [sampleState, setSampleState] = useState('idle')
  const [personDescription, setPersonDescription] = useState('')

  // L1 state
  const [l1Result,     setL1Result]     = useState(null)
  const [l1Loading,    setL1Loading]    = useState(false)
  const [showL1Prompt, setShowL1Prompt] = useState(false)
  const [showL1Output, setShowL1Output] = useState(false)

  // L2 state
  const [l2Result,     setL2Result]     = useState(null)
  const [l2Loading,    setL2Loading]    = useState(false)
  const [showL2Prompt, setShowL2Prompt] = useState(false)
  const [showL2Output, setShowL2Output] = useState(false)

  // L3 state
  const [l3FreeOutput, setL3FreeOutput] = useState(null)
  const [l3AskOutput,  setL3AskOutput]  = useState(null)
  const [l3Loading,    setL3Loading]    = useState(null)
  const [l3Error,      setL3Error]      = useState(null)
  const [showL3Prompt, setShowL3Prompt] = useState(false)
  const [showL3Output, setShowL3Output] = useState(false)

  // L4 state
  const [freeOutput,   setFreeOutput]   = useState(null)
  const [freeLoading,  setFreeLoading]  = useState(false)
  const [freeError,    setFreeError]    = useState(null)
  const [showL4Prompt, setShowL4Prompt] = useState(false)
  const [showL4Output, setShowL4Output] = useState(false)

  // L5 state
  const [mirrorOutput,      setMirrorOutput]      = useState(null)
  const [circuitTokens,     setCircuitTokens]     = useState(null)  // AI output circuit
  const [userCircuitTokens, setUserCircuitTokens] = useState(null)  // user response circuit
  const [mirrorLoading, setMirrorLoading] = useState(false)
  const [mirrorError,   setMirrorError]   = useState(null)
  const [showL5Prompt,  setShowL5Prompt]  = useState(false)
  const [showL5Output,  setShowL5Output]  = useState(false)

  // Custom L5
  const [customL5,      setCustomL5]      = useState('')
  const [customOutput,  setCustomOutput]  = useState(null)
  const [customTokens,  setCustomTokens]  = useState(null)
  const [customLoading, setCustomLoading] = useState(false)
  const [customError,   setCustomError]   = useState(null)

  // Generate v2
  const [generatedPrompt, setGeneratedPrompt] = useState(null)
  const [userResponse,    setUserResponse]    = useState('')
  const [generating,      setGenerating]      = useState(false)
  const [error,           setError]           = useState(null)
  const [copied,          setCopied]          = useState(false)

  function buildPortrait() {
    const parts = []
    if (quantOn && quantText.trim()) parts.push(quantText.trim())
    if (qualOn  && qualText.trim())  parts.push(qualText.trim())
    return parts.length > 0 ? parts.join('\n\n') : null
  }

  function computeL1Prompt() { return buildAISystemPrompt(identity.lang) }
  function computeL2Prompt() { return buildLearnerIntroduction(inventory, buildPortrait()) }
  function computeL3Prompt() { return `${computeL2Prompt()}\n\n${buildLevelChannel(identity.cefrLevel, currentCluster)}` }

  const mirrorPromptBlock = worldTexture

  const mirrorDirective = [
    `Ask this person one question — something they can respond to in writing, in ${scope.sentences}. Natural and conversational. Not like a language exercise. One sentence only.`,
    targetAtomIds.size > 0 && `Draw toward these structures if it fits naturally: ${[...targetAtomIds].map(id => ATOM_BY_ID[id]?.label ?? id).join(', ')}.`,
    effectiveForce && effectiveForce,
  ].filter(Boolean).join(' ')

  function computeL4Prompt() { return `${computeL3Prompt()}\n\n${mirrorPromptBlock}` }
  function computeL5Prompt() { return mirrorDirective }

  async function handleL1Generate() {
    setL1Loading(true)
    try {
      const res = await fetch('/__generate-layer-test', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'l1', lang: identity.lang }),
      })
      const data = await res.json()
      setL1Result(data.sentence ?? data.text ?? '')
      setShowL1Output(true)
    } catch (e) {}
    finally { setL1Loading(false) }
  }

  async function handleL2Generate() {
    setL2Loading(true)
    try {
      const res = await fetch('/__generate-layer-test', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'l1l2', lang: identity.lang, learnerBlock: computeL2Prompt() }),
      })
      const data = await res.json()
      setL2Result(data.sentence ?? data.text ?? '')
      setShowL2Output(true)
    } catch (e) {}
    finally { setL2Loading(false) }
  }

  async function handleGenerateSample() {
    setSampleState('loading')
    try {
      const res = await fetch('/__generate-sample-portrait', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang: identity.lang }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error()
      setQualText(data.portrait)
      setQualOn(true)
      setSampleState('result')
    } catch { setSampleState('idle') }
  }

  async function handleL3(type) {
    setL3Loading(type); setL3Error(null)
    if (type === 'free') setL3FreeOutput(null)
    else setL3AskOutput(null)
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
      if (type === 'free') { setL3FreeOutput(output); setShowL3Output(true) }
      else setL3AskOutput(output)
    } catch (e) { setL3Error(e.message) }
    finally { setL3Loading(null) }
  }

  async function handleFreeGenerate() {
    setFreeLoading(true); setFreeError(null); setFreeOutput(null)
    try {
      const res = await fetch('/__generate-layer-test', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'l1l2l3l4', lang: identity.lang, cefrLevel: identity.cefrLevel, currentCluster,
          learnerBlock: computeL2Prompt(), promptBlock: mirrorPromptBlock,
        }),
      })
      const data = await res.json()
      setFreeOutput(data.sentence ?? data.text ?? '')
      setShowL4Output(true)
    } catch (e) { setFreeError(e.message) }
    finally { setFreeLoading(false) }
  }

  async function handleMirrorGenerate() {
    setMirrorLoading(true); setMirrorError(null); setMirrorOutput(null); setCircuitTokens(null)
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
      setMirrorOutput(output)
      setCircuitTokens(checkCircuit(output, wordBank))
      setShowL5Output(true)
    } catch (e) { setMirrorError(e.message) }
    finally { setMirrorLoading(false) }
  }

  async function handleCustomL5() {
    if (!customL5.trim()) return
    setCustomLoading(true); setCustomError(null); setCustomOutput(null); setCustomTokens(null)
    try {
      const res = await fetch('/__generate-layer-test', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'l1l2l3', lang: identity.lang, cefrLevel: identity.cefrLevel, currentCluster,
          learnerBlock: computeL2Prompt(), directiveOverride: customL5.trim(),
        }),
      })
      const data = await res.json()
      const output = data.sentence ?? data.text ?? ''
      setCustomOutput(output)
      setCustomTokens(checkCircuit(output, wordBank))
    } catch (e) { setCustomError(e.message) }
    finally { setCustomLoading(false) }
  }

  async function handleGenerate() {
    if (targetAtomIds.size === 0) return
    setGenerating(true); setError(null); setGeneratedPrompt(null); setUserResponse('')
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
      setGeneratedPrompt(data.prompt)
    } catch (e) { setError(e.message) }
    finally { setGenerating(false) }
  }

  const TABS   = ['grammar', 'vocabulary', 'force', 'portrait']
  const canGen = targetAtomIds.size > 0 && !generating
  const canSubmit = (userResponse ?? '').trim().length > 0

  const textarea = { border: `1px solid ${T.border}`, borderRadius: 4, color: T.text, fontSize: 13, padding: '10px 12px', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6, width: '100%', background: T.card }

  function generateRandomSentence() {
    const pickFrom = (...atomIds) => {
      for (const id of atomIds) {
        const words = atomWords[id] ?? []
        if (words.length > 0) return words[Math.floor(Math.random() * words.length)]
      }
      return null
    }

    // Default atom sources for slots not covered by slotOverrides
    const SLOT_DEFAULTS = {
      object:            ['noun', 'object_pronoun'],
      complement:        ['adjective', 'noun'],
      determiner:        ['determiner', 'possessive_determiner', 'demonstrative'],
      subject_adjective: ['adjective'],
      modal:             ['modal_auxiliary'],
      interjection:      ['interjection'],
      adverbial:         ['adverb'],
    }

    // Tiers up to current cluster; skip T8+ (negation/progressive need verb inflection)
    const availableTiers = CONSTRUCTOR_TIERS.filter(t => t.band <= currentCluster && t.id <= 7)

    for (const tier of [...availableTiers].reverse()) {
      const parts = []
      let ok = true

      for (const slotId of tier.slotIds) {
        const override = tier.slotOverrides?.[slotId]
        const optional = override?.optional === true
        const accepts  = override?.accepts ?? SLOT_DEFAULTS[slotId] ?? []
        const word     = accepts.length > 0 ? pickFrom(...accepts) : null

        if (!word && !optional) { ok = false; break }
        if (word) parts.push(word)
      }

      if (ok && parts.length > 0) {
        const sentence = parts.join(' ')
        return sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.'
      }
    }

    // Last resort: pronoun + verb
    const pronoun = pickFrom('personal_pronoun') ?? 'I'
    const verb    = pickFrom('lexical_verb')
    if (verb) return `${pronoun.charAt(0).toUpperCase() + pronoun.slice(1)} ${verb}.`
    return ''
  }

  return (
    <div style={{ padding: '24px 24px 80px', fontFamily: 'system-ui, sans-serif', background: T.page, minHeight: '100vh', color: T.text }}>

      {/* Header */}
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
        {showL1Output && l1Result && (
          <OutputBlock text={l1Result} onCopy={() => navigator.clipboard.writeText(l1Result)} />
        )}
      </LayerSection>

      {/* ── L2 ── */}
      <LayerSection id="L2" label="Portrait"
        onGenerate={handleL2Generate} loading={l2Loading}
        prompt={computeL2Prompt()} showPrompt={showL2Prompt} onTogglePrompt={() => setShowL2Prompt(p => !p)}
        hasOutput={!!l2Result} showOutput={showL2Output} onToggleOutput={() => setShowL2Output(p => !p)}
      >
        <div style={{ padding: '14px 16px', borderTop: `1px solid ${T.border}` }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
            <button onClick={() => setQuantOn(p => !p)}
              style={{ ...btn('blue', quantOn), flexShrink: 0, marginTop: 2, fontSize: 11, padding: '3px 10px' }}>
              quant
            </button>
            <textarea value={quantText} onChange={e => setQuantText(e.target.value)}
              placeholder="quantitative portrait — patterns, composition, position"
              style={{ ...textarea, minHeight: 48, opacity: quantOn ? 1 : 0.45, fontSize: 12 }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
            <button onClick={() => setQualOn(p => !p)}
              style={{ ...btn('blue', qualOn), flexShrink: 0, marginTop: 2, fontSize: 11, padding: '3px 10px' }}>
              qual
            </button>
            <textarea value={qualText} onChange={e => setQualText(e.target.value)}
              placeholder="who this person is — not how they learn, but who they are"
              style={{ ...textarea, minHeight: 48, opacity: qualOn ? 1 : 0.45, fontSize: 12 }} />
          </div>
          <button onClick={handleGenerateSample} disabled={sampleState === 'loading'}
            style={{ ...btn('blue', false), opacity: sampleState === 'loading' ? 0.4 : 1, cursor: sampleState === 'loading' ? 'default' : 'pointer' }}>
            {sampleState === 'loading' ? 'generating…' : 'generate sample user'}
          </button>
        </div>
        {showL2Output && l2Result && (
          <OutputBlock text={l2Result} onCopy={() => navigator.clipboard.writeText(l2Result)} />
        )}
      </LayerSection>

      {/* ── L3 ── */}
      <LayerSection id="L3"
        onGenerate={() => handleL3('free')} loading={l3Loading === 'free'}
        prompt={computeL3Prompt()} showPrompt={showL3Prompt} onTogglePrompt={() => setShowL3Prompt(p => !p)}
        hasOutput={!!l3FreeOutput} showOutput={showL3Output} onToggleOutput={() => setShowL3Output(p => !p)}
      >
        {showL3Output && l3FreeOutput && (
          <OutputBlock label="Free output" text={l3FreeOutput} onCopy={() => navigator.clipboard.writeText(l3FreeOutput)} />
        )}
        {/* L3 ask — inline secondary */}
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
        onGenerate={handleFreeGenerate} loading={freeLoading}
        prompt={computeL4Prompt()} showPrompt={showL4Prompt} onTogglePrompt={() => setShowL4Prompt(p => !p)}
        hasOutput={!!freeOutput} showOutput={showL4Output} onToggleOutput={() => setShowL4Output(p => !p)}
      >
        {showL4Output && freeOutput && (
          <OutputBlock label="Output (no task)" text={freeOutput} onCopy={() => navigator.clipboard.writeText(freeOutput)} />
        )}
        {freeError && <p style={{ fontSize: 12, color: T.red, margin: '0 14px 8px' }}>{freeError}</p>}

        {/* Constructor */}
        <div style={{ padding: '14px 16px', borderTop: `1px solid ${T.border}`, background: '#dcdcde' }}>
          <Label>Constructor</Label>

          <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{ ...btn('default', activeTab === tab), fontSize: 12 }}>
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

          <AssembledPromptPanel
            cefrLevel={identity.cefrLevel} worldTexture={worldTexture}
            scope={scope} effectiveForce={effectiveForce} difficulty={difficulty}
          />

          {/* Scope override */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: T.label, letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0 }}>Scope</span>
            {[1, 2, 3, 4].map(n => {
              const active = (scopeOverride ?? currentCluster) === n
              const isAuto = scopeOverride === null && n === currentCluster
              return (
                <button key={n} onClick={() => setScopeOverride(scopeOverride === n ? null : n)}
                  style={{ ...btn('purple', active), fontSize: 12 }}>
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
        onGenerate={handleMirrorGenerate} loading={mirrorLoading}
        prompt={computeL5Prompt()} showPrompt={showL5Prompt} onTogglePrompt={() => setShowL5Prompt(p => !p)}
        hasOutput={!!mirrorOutput} showOutput={showL5Output} onToggleOutput={() => setShowL5Output(p => !p)}
      >
        {showL5Output && mirrorOutput && (
          <div style={{ padding: '12px 14px', borderTop: `1px solid ${T.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: T.label, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Output</span>
              <button onClick={() => {
                const summary = circuitSummary(circuitTokens)
                navigator.clipboard.writeText([
                  `OUTPUT: ${mirrorOutput}`,
                  `CIRCUIT: ${summary.passed}/${summary.total} passed`,
                  summary.unknownWords.length > 0 ? `UNKNOWN: ${summary.unknownWords.join(', ')}` : `UNKNOWN: none`,
                ].join('\n'))
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
                  navigator.clipboard.writeText([
                    `L5: ${customL5.trim()}`,
                    `OUTPUT: ${customOutput}`,
                    `CIRCUIT: ${summary.passed}/${summary.total} passed`,
                    summary.unknownWords.length > 0 ? `UNKNOWN: ${summary.unknownWords.join(', ')}` : `UNKNOWN: none`,
                  ].join('\n'))
                }} style={{ ...btn(), fontSize: 11 }}>copy</button>
              </div>
              <p style={{ margin: '0 0 8px', fontSize: 15, color: T.text, lineHeight: 1.7 }}>{customOutput}</p>
              {customTokens && <CircuitDisplay tokens={customTokens} />}
            </div>
          )}
        </div>

        {/* Generate just from writing */}
        <div style={{ padding: '14px 16px', borderTop: `1px solid ${T.border}` }}>
          <button onClick={handleGenerate} disabled={!canGen}
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
                    effectiveForce ? `FORCE: ${effectiveForce}` : null,
                    ``,
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
            <button onClick={() => { setUserResponse(''); setUserCircuitTokens(null) }}
              style={{ ...btn(), fontSize: 11, padding: '3px 10px' }}>clear</button>
          </div>
          <textarea value={userResponse}
            onChange={e => {
              setUserResponse(e.target.value)
              setUserCircuitTokens(e.target.value.trim() ? checkCircuitFull(e.target.value, wordBank, atomWords) : null)
            }}
            placeholder={s.writingLab.responsePlaceholder}
            style={{ ...textarea, minHeight: 120, fontSize: 15 }} />
          <button onClick={() => {}} disabled={!canSubmit}
            style={{ ...btn('blue', false), marginTop: 10, width: '100%', padding: '10px', fontSize: 14, opacity: canSubmit ? 1 : 0.4, cursor: canSubmit ? 'pointer' : 'default' }}>
            {s.writingLab.submit}
          </button>
          {userCircuitTokens && <CircuitDisplay tokens={userCircuitTokens} />}
          {userResponse.trim() && <SentenceCircuitDisplay text={userResponse} wordBank={wordBank} wordTokens={userCircuitTokens} />}
        </div>
      </LayerSection>


    </div>
  )
}
