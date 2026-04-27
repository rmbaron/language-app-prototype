import { useState } from 'react'
import { T, btn, modeBtn, rowBtn, Label, SlotOutput } from './writingLabTheme'
import { GRAMMAR_CLUSTERS } from './grammarClustering.en'
import { CONSTRUCTOR_TIERS } from './constructorTiers.en.js'
import { ATOMS } from './grammarAtoms.en'

export const ATOM_BY_ID = Object.fromEntries(ATOMS.map(a => [a.id, a]))

export const CLUSTER_SCOPE = {
  1: { sentences: '1 sentence',    structure: 'Subject + Verb · S + V + Object' },
  2: { sentences: '1–2 sentences', structure: '+ Description · Identity · Questions' },
  3: { sentences: '2–3 sentences', structure: '+ Connectors · Location · Time · Manner' },
  4: { sentences: '3–5 sentences', structure: '+ Modal · Negation · Progressive' },
}

export const CLUSTER_FORCE = {
  1: 'The prompt must require a complete Subject + Verb + Object sentence.',
  2: 'The prompt must require the learner to use "be" (am/is/are) — to describe, identify, or locate something.',
  3: 'The prompt must require the learner to use a connector (and, but, because, or) or a question word (where, when, why, how).',
  4: "The prompt must require the learner to use a modal verb (can/can't/will), negation (don't/doesn't/not), or present progressive (am/is/are + -ing).",
}

export function GrammarTargetTab({ activeAtoms, atomWords, targetAtomIds, setTargetAtomIds, difficulty, setDifficulty }) {
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

export function VocabularyContextTab({ topicClusters, selectedTopicKey, setSelectedTopicKey, vocabMode, setVocabMode }) {
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

export function ScopeTab({ currentCluster, scope }) {
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

export function ForceTab({ forceMode, setForceMode, autoForce, customForce, setCustomForce }) {
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

export function PortraitTab() {
  return (
    <div>
      <p style={{ margin: '0 0 12px', fontSize: 13, color: T.textSub, lineHeight: 1.7 }}>
        Portrait fragments accumulate here as the app learns who the user is through their writing and interactions.
      </p>
      <SlotOutput value="(empty — portrait not yet built)" />
    </div>
  )
}

export function AssembledPromptPanel({ cefrLevel, worldTexture, scope, effectiveForce, difficulty }) {
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
