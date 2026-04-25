import { useState } from 'react'
import { getActiveLanguage, getInterfaceLanguage } from './learnerProfile'
import { getStrings } from './uiStrings'
import { getWordBank } from './userStore'
import { getBankedWords } from './wordRegistry'
import { getLearnerGrammarState } from './learnerGrammarState'
import { CONSTRUCTOR_TIERS } from './constructorTiers.en.js'
import { assembleFrame, assembleRandomFrame } from './frameAssembler'
import { generatePracticeSentence } from './practiceGenerate'
import GrammarStatePanel from './GrammarStatePanel'
import { buildLearnerIntroduction } from './systemVocabulary'

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

function getEligibleTiers(activeAtoms) {
  const active = new Set(activeAtoms)
  return CONSTRUCTOR_TIERS.filter(tier => {
    const cumulativeAtoms = CONSTRUCTOR_TIERS
      .filter(t => t.id <= tier.id)
      .flatMap(t => t.atoms)
    return cumulativeAtoms.every(a => active.has(a))
  })
}

export default function WorldReadingLane({ onBack }) {
  const s          = getStrings(getInterfaceLanguage())
  const activeLang = getActiveLanguage()

  const [sentence,        setSentence]        = useState(null)
  const [recentSentences, setRecentSentences] = useState([])
  const [loading,         setLoading]         = useState(false)
  const [error,           setError]           = useState(null)
  const [hasGenerated,    setHasGenerated]    = useState(false)
  const [lastSnapshot,    setLastSnapshot]    = useState(null)
  const [copied,          setCopied]          = useState(false)
  const [forcedTierId,    setForcedTierId]    = useState(null)

  function getCurrentState() {
    const grammarState = getLearnerGrammarState(activeLang)
    const tiers        = getEligibleTiers(grammarState.activeAtoms)
    const bankWords    = getBankedWords(getWordBank(), activeLang)
    return { tiers, bankWords, activeAtoms: grammarState.activeAtoms, currentCluster: grammarState.currentCluster }
  }

  const { tiers: eligibleTiers, bankWords } = getCurrentState()
  const eligibleSet = new Set(eligibleTiers.map(t => t.id))
  const noStructures = eligibleTiers.length === 0 || bankWords.length === 0

  async function runGenerate() {
    const { tiers, bankWords: freshBank, activeAtoms, currentCluster } = getCurrentState()
    if (!freshBank.length) return

    const forcedTier = forcedTierId ? CONSTRUCTOR_TIERS.find(t => t.id === forcedTierId) : null
    if (!forcedTier && !tiers.length) { setError('No eligible tiers — unlock some atoms first.'); return }
    const assembled  = forcedTier
      ? { tier: forcedTier, frame: assembleFrame(forcedTier, freshBank, activeLang) }
      : assembleRandomFrame(tiers, freshBank, activeLang)
    if (!assembled?.frame) { setError('Could not fill frame — check your word bank.'); return }

    const { tier, frame } = assembled
    setLoading(true)
    setError(null)
    try {
      const result = await generatePracticeSentence({ frame, lane: 'reading', recentSentences })
      setSentence(result)
      setHasGenerated(true)
      setRecentSentences(prev => [...prev.slice(-4), result])
      setLastSnapshot({ tier, frame, sentence: result, activeAtoms, currentCluster })
      setCopied(false)
    } catch {
      setError(s.readingPractice.error)
    } finally {
      setLoading(false)
    }
  }

  const grammarState  = getLearnerGrammarState(activeLang)
  const learnerBlock  = buildLearnerIntroduction({
    wordBank: bankWords,
    identity: { nativeLang: getInterfaceLanguage(), lang: activeLang },
    grammarPosition: { activeAtoms: grammarState.activeAtoms, currentCluster: grammarState.currentCluster, atomWords: grammarState.atomWords },
  })

  return (
    <div className="reading-practice">
      <button className="profile-back" onClick={onBack}>{s.common.back}</button>
      <p className="reading-practice-title">{s.readingPractice.title}</p>

      <GrammarStatePanel />

      <details style={{ margin: '12px 0 6px', fontSize: 11, color: '#555' }}>
        <summary style={{ cursor: 'pointer' }}>Tiers</summary>
        <ul style={{ margin: '6px 0 0 12px', padding: 0, lineHeight: 1.8 }}>
          {CONSTRUCTOR_TIERS.map(t => {
            const locked = !eligibleSet.has(t.id)
            return (
              <li key={t.id} style={{ color: locked ? '#bbb' : forcedTierId === t.id ? '#ccc' : '#555' }}>
                <strong>T{t.id}</strong>{locked ? ' 🔒' : ''} — {t.label}
              </li>
            )
          })}
        </ul>
      </details>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '0 0 8px' }}>
        <button
          style={{ fontSize: 11, padding: '3px 8px', background: forcedTierId === null ? '#333' : 'none', border: '1px solid #333', borderRadius: 4, cursor: 'pointer', color: forcedTierId === null ? '#fff' : '#555' }}
          onClick={() => setForcedTierId(null)}
        >random</button>
        {CONSTRUCTOR_TIERS.map(t => {
          const locked = !eligibleSet.has(t.id)
          return (
            <button
              key={t.id}
              style={{ fontSize: 11, padding: '3px 8px', background: forcedTierId === t.id ? '#333' : 'none', border: `1px solid ${locked ? '#ccc' : '#333'}`, borderRadius: 4, cursor: 'pointer', color: forcedTierId === t.id ? '#fff' : locked ? '#bbb' : '#555' }}
              title={t.label}
              onClick={() => setForcedTierId(t.id)}
            >T{t.id}</button>
          )
        })}
      </div>

      {noStructures && <p className="reading-practice-empty">{s.readingPractice.noStructures}</p>}

      <button
        className="reading-practice-next"
        onClick={runGenerate}
        disabled={loading}
      >
        {loading
          ? s.readingPractice.generating
          : hasGenerated
            ? s.readingPractice.next
            : 'Generate'}
      </button>

      {error && <p className="reading-practice-error">{error}</p>}
      {sentence && !loading && (
        <>
          {lastSnapshot && (
            <button
              style={{ display: 'block', fontSize: 11, color: copied ? '#8f8' : '#555', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0 8px' }}
              onClick={() => {
                const lines = [
                  `"${lastSnapshot.sentence}"`,
                  '',
                  `Cluster: ${lastSnapshot.currentCluster}`,
                  `Active atoms: ${lastSnapshot.activeAtoms.join(', ')}`,
                  `Tier: ${lastSnapshot.tier.label}`,
                  '',
                  'Frame:',
                  ...Object.entries(lastSnapshot.frame).map(([slot, word]) => `  ${slot}: ${word}`),
                ]
                navigator.clipboard.writeText(lines.join('\n'))
                setCopied(true)
              }}
            >
              {copied ? 'Copied' : 'Copy for testing'}
            </button>
          )}
          <p className="reading-practice-sentence">{sentence}</p>
        </>
      )}

      <LayerTestPanel lang={activeLang} learnerBlock={learnerBlock} />
      <div style={{ height: 80 }} />
    </div>
  )
}
