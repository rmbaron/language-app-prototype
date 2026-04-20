import { useState } from 'react'
import { WORD_SEED } from './wordSeed.en'
import { hasLayerOne, getLayerOne } from './wordLayerOne'
import { hasLayerTwo, getLayerTwo, hasRealLayerTwo } from './wordLayerTwo'
import { runLayerOneBatch, enrichWord } from './wordEnrichment'
import { runLayerTwoBatch, enrichWordL2 } from './wordEnrichmentTwo'
import { addContent, hasContent } from './contentStore'

const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

function wordLayerStatuses(word) {
  const l1data = getLayerOne(word.id, 'en')
  const l2data = getLayerTwo(word.id, 'en')
  return {
    level: l2data?.cefrLevel ?? 'Unleveled',
    l1: !hasLayerOne(word.id, 'en') ? 'none' : l1data?.source === 'api' ? 'api' : 'pre',
    l2: !hasLayerTwo(word.id, 'en') ? 'none' : hasRealLayerTwo(word.id, 'en') ? 'api' : 'mock',
    l3: l2data?.contentReady ? 'ready' : 'none',
  }
}

const CHIP_STYLE = {
  api:   { background: '#1a3a1a', color: '#6fcf6f', border: '1px solid #3a6a3a' },
  pre:   { background: '#1a2a3a', color: '#6fa8cf', border: '1px solid #2a4a6a' },
  mock:  { background: '#2a2a1a', color: '#cfb96f', border: '1px solid #5a4a1a' },
  ready: { background: '#1a3a1a', color: '#6fcf6f', border: '1px solid #3a6a3a' },
  none:  { background: '#111', color: '#444', border: '1px solid #222' },
}

function Badge({ label, status }) {
  return (
    <span style={{
      padding: '1px 7px',
      borderRadius: 3,
      fontSize: 11,
      fontFamily: 'monospace',
      whiteSpace: 'nowrap',
      ...CHIP_STYLE[status],
    }}>
      {label}
    </span>
  )
}

function LevelGroup({ level, words, onEnrich }) {
  const [open, setOpen] = useState(level !== 'Unleveled')

  return (
    <div style={{ marginBottom: 12 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '4px 0', width: '100%', textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 12, color: '#555' }}>{open ? '▼' : '▶'}</span>
        <span style={{ fontWeight: 600, fontSize: 13, color: '#aaa' }}>{level}</span>
        <span style={{ fontSize: 12, color: '#555' }}>{words.length} words</span>
      </button>

      {open && (
        <div style={{ marginTop: 4 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '120px 60px 60px 60px 60px',
            gap: '2px 8px',
            fontSize: 11,
            color: '#444',
            padding: '2px 0 4px 20px',
          }}>
            <span>word</span><span>L1</span><span>L2</span><span>L3</span><span></span>
          </div>
          {words.map(({ word, s }) => (
            <div key={word.id} style={{
              display: 'grid',
              gridTemplateColumns: '120px 60px 60px 60px 60px',
              gap: '2px 8px',
              alignItems: 'center',
              padding: '2px 0 2px 20px',
            }}>
              <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#ccc' }}>
                {word.baseForm}
              </span>
              <Badge label={s.l1 === 'none' ? '—' : s.l1} status={s.l1} />
              <Badge label={s.l2 === 'none' ? '—' : s.l2} status={s.l2} />
              <Badge label={s.l3 === 'none' ? '—' : 'ready'} status={s.l3} />
              <div style={{ display: 'flex', gap: 4 }}>
                {s.l1 !== 'api' && (
                  <button className="dev-toggle" style={{ padding: '1px 6px', fontSize: 11 }}
                    onClick={() => onEnrich(word.id, 'l1')}>L1</button>
                )}
                {s.l1 === 'api' && s.l2 !== 'api' && (
                  <button className="dev-toggle" style={{ padding: '1px 6px', fontSize: 11 }}
                    onClick={() => onEnrich(word.id, 'l2')}>L2</button>
                )}
                {s.l2 === 'api' && s.l3 === 'none' && (
                  <button className="dev-toggle" style={{ padding: '1px 6px', fontSize: 11 }}
                    onClick={() => onEnrich(word.id, 'l3')}>L3</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function WordPipeline({ onClose }) {
  const [running, setRunning] = useState(null)
  const [search, setSearch] = useState('')
  const [, forceUpdate] = useState(0)

  async function runBatch(layer) {
    setRunning(layer)
    try {
      if (layer === 'l1') await runLayerOneBatch('en')
      if (layer === 'l2') await runLayerTwoBatch('en')
    } finally {
      setRunning(null)
      forceUpdate(n => n + 1)
    }
  }

  async function handleEnrich(wordId, layer) {
    setRunning(wordId + layer)
    try {
      if (layer === 'l1') await enrichWord(wordId, 'en')
      if (layer === 'l2') await enrichWordL2(wordId, 'en')
      if (layer === 'l3') {
        const word = WORD_SEED.find(w => w.id === wordId)
        addContent(wordId, 'reading', { text: `I want ${word.baseForm} today.` })
      }
    } finally {
      setRunning(null)
      forceUpdate(n => n + 1)
    }
  }

  const query = search.trim().toLowerCase()
  const filtered = WORD_SEED.filter(w =>
    !query || w.baseForm.toLowerCase().includes(query) || w.id.includes(query)
  )

  // Group by level
  const groups = {}
  for (const word of filtered) {
    const s = wordLayerStatuses(word)
    const lvl = s.level
    if (!groups[lvl]) groups[lvl] = []
    groups[lvl].push({ word, s })
  }

  // Unleveled words are A1 candidates not yet enriched — nest them under A1
  if (groups['Unleveled']?.length) {
    groups['A1'] = [...(groups['A1'] ?? []), ...groups['Unleveled']]
  }

  const orderedGroups = LEVEL_ORDER
    .filter(lvl => groups[lvl]?.length)
    .map(lvl => ({ level: lvl, words: groups[lvl] }))

  return (
    <div style={{ padding: '20px 24px', maxWidth: 600, margin: '0 auto' }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <button className="dev-toggle" onClick={onClose}>← Back</button>
        <span style={{ fontWeight: 600, fontSize: 15, color: '#ccc' }}>Word Pipeline</span>
        <span style={{ fontSize: 12, color: '#555', marginLeft: 'auto' }}>
          {filtered.length} / {WORD_SEED.length} words
        </span>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search words…"
          style={{
            flex: 1, padding: '5px 10px', borderRadius: 4,
            background: '#1a1a1a', border: '1px solid #333',
            color: '#ccc', fontSize: 13, fontFamily: 'monospace',
          }}
        />
        <button className="dev-toggle" onClick={() => runBatch('l1')} disabled={!!running}>
          {running === 'l1' ? 'Running…' : 'Run L1'}
        </button>
        <button className="dev-toggle" onClick={() => runBatch('l2')} disabled={!!running}>
          {running === 'l2' ? 'Running…' : 'Run L2'}
        </button>
      </div>

      <div style={{ fontSize: 11, color: '#444', marginBottom: 16, display: 'flex', gap: 12 }}>
        <Badge label="api" status="api" /> api &nbsp;
        <Badge label="pre" status="pre" /> pre-pop &nbsp;
        <Badge label="mock" status="mock" /> mock &nbsp;
        <Badge label="—" status="none" /> missing
      </div>

      {orderedGroups.map(({ level, words }) => (
        <LevelGroup key={level} level={level} words={words} onEnrich={handleEnrich} />
      ))}

      {orderedGroups.length === 0 && (
        <p style={{ color: '#555', fontSize: 13 }}>No words match.</p>
      )}
    </div>
  )
}
