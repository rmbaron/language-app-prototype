import { useState, useEffect, useRef } from 'react'
import celestialDesign from './celestialDesign'
import { applyDesignToDOM } from './applyDesign'
import { getPhase1Sequence } from './phase1Sequence'
import { getActiveLanguage, getInterfaceLanguage } from './learnerProfile'
import { getStrings } from './uiStrings'
import allWords from './wordData'
import GrammarSlot from './GrammarSlot'

const FONTS = [
  { name: null,                 label: 'Default'           },
  { name: 'Inter',              label: 'Inter'             },
  { name: 'Raleway',            label: 'Raleway'           },
  { name: 'Josefin Sans',       label: 'Josefin Sans'      },
  { name: 'Space Grotesk',      label: 'Space Grotesk'     },
  { name: 'DM Sans',            label: 'DM Sans'           },
  { name: 'Cormorant Garamond', label: 'Cormorant Garamond'},
  { name: 'Playfair Display',   label: 'Playfair Display'  },
  { name: 'Cinzel',             label: 'Cinzel'            },
  { name: 'EB Garamond',        label: 'EB Garamond'       },
  { name: 'Spectral',           label: 'Spectral'          },
  { name: 'Lora',               label: 'Lora'              },
]

const WEIGHTS = [
  { value: 300, label: 'Light'   },
  { value: 400, label: 'Regular' },
  { value: 500, label: 'Medium'  },
  { value: 700, label: 'Bold'    },
  { value: 900, label: 'Black'   },
]

// Grammatical categories available for grammar slots
const SLOT_CATEGORIES = [
  'pronoun', 'verb', 'noun', 'adjective',
  'adverb', 'conjunction', 'preposition',
  'determiner', 'interjection', 'interrogative', 'demonstrative',
]

// Maps a clicked Celestial element to an editor section key
const ELEMENT_SECTION_MAP = [
  { selector: '.celestial-slot',       section: 'sentencePhase'  },  // sentence phase boxes
  { selector: '.celestial-floating-word', section: 'sentencePhase' }, // floating word
  { selector: '.grammar-slot',         section: 'grammarSlots'   },
  { selector: '.celestial-word-wrap',  section: 'word'           },
  { selector: '.celestial-meaning',    section: 'meaning'        },
  { selector: '.moment-banner',        section: 'banner'         },
  { selector: '.function-unlock',      section: 'functionUnlock' },
  { selector: '.lane-stamp',           section: 'laneStamp'      },
  { selector: '.celestial-mic-wrap',   section: 'mic'            },
]

// Lane phases that have sentence content
const LANE_PHASES = ['arriving', 'reading_ack', 'writing', 'listening', 'speaking']
const PHASE_TO_LANE = {
  arriving:    'reading',
  reading_ack: 'reading',
  writing:     'writing',
  listening:   'listening',
  speaking:    'speaking',
  sentence:    null,
  transition:  null,
}

let _nextSlotId = 1
function newSlotId() { return `slot-${_nextSlotId++}` }

const DEFAULT_GHOST = { enabled: false, opacity: 0.25, wrap: false }

export default function CelestialEditor({ workspace = false, onJumpTo, onSequenceChange, onGhostChange }) {
  const [open,      setOpen]      = useState(true)
  const [design,    setDesign]    = useState(() => structuredClone(celestialDesign))
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [seqSaving, setSeqSaving] = useState(false)
  const [seqSaved,  setSeqSaved]  = useState(false)
  const [flashKey,  setFlashKey]  = useState({})
  const [ghost,     setGhost]     = useState(DEFAULT_GHOST)

  // Stage navigator state
  const [navWordIndex, setNavWordIndex] = useState(0)
  const [navPhase,     setNavPhase]     = useState('arriving')

  // Editable sequence — local working copy
  const activeLang = getActiveLanguage()
  const s          = getStrings(getInterfaceLanguage())
  const [sequence, setSequence] = useState(() => structuredClone(getPhase1Sequence(activeLang)))

  const sectionRefs = useRef({})

  // Propagate sequence changes to CelestialScreen immediately (live preview)
  useEffect(() => {
    onSequenceChange?.(sequence)
  }, [sequence])

  // Propagate ghost settings live
  useEffect(() => {
    onGhostChange?.(ghost.enabled ? ghost : null)
  }, [ghost])

  // E key toggles the panel
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'e' && !e.target.matches('input, textarea')) {
        setOpen(o => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Click-to-select: clicks on Celestial elements scroll + flash the section
  useEffect(() => {
    if (!open) return
    function handleClick(e) {
      for (const { selector, section } of ELEMENT_SECTION_MAP) {
        if (e.target.closest(selector)) {
          const el = sectionRefs.current[section]
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
          setFlashKey(prev => ({ ...prev, [section]: (prev[section] ?? 0) + 1 }))
          break
        }
      }
    }
    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [open])

  // ── Design update helpers ────────────────────────────────────
  function update(path, value) {
    setDesign(prev => {
      const next = structuredClone(prev)
      let obj = next
      for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]]
      obj[path[path.length - 1]] = value
      applyDesignToDOM(next)
      return next
    })
  }

  function nudge(path, delta) {
    setDesign(prev => {
      const next = structuredClone(prev)
      let obj = next
      for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]]
      obj[path[path.length - 1]] = (obj[path[path.length - 1]] ?? 0) + delta
      applyDesignToDOM(next)
      return next
    })
  }

  // ── Sequence update helpers ──────────────────────────────────
  function updateEntry(wordIndex, updater) {
    setSequence(prev => {
      const next = structuredClone(prev)
      updater(next[wordIndex])
      return next
    })
  }

  function updateSentence(wordIndex, lane, sentenceIndex, text) {
    updateEntry(wordIndex, entry => {
      entry.sentences[lane][sentenceIndex] = { text }
    })
  }

  function addSentence(wordIndex, lane) {
    updateEntry(wordIndex, entry => {
      if (!entry.sentences[lane]) entry.sentences[lane] = []
      entry.sentences[lane].push({ text: '___.' })
    })
  }

  function removeSentence(wordIndex, lane, sentenceIndex) {
    updateEntry(wordIndex, entry => {
      entry.sentences[lane].splice(sentenceIndex, 1)
    })
  }

  function updateFunctionUnlocked(wordIndex, value) {
    updateEntry(wordIndex, entry => { entry.functionUnlocked = value })
  }

  // ── Grammar slot helpers ─────────────────────────────────────
  function addSlot(wordIndex, category) {
    updateEntry(wordIndex, entry => {
      if (!entry.grammarSlots) entry.grammarSlots = []
      entry.grammarSlots.push({ id: newSlotId(), category, x: 50, y: 50 })
    })
  }

  function removeSlot(wordIndex, slotId) {
    updateEntry(wordIndex, entry => {
      entry.grammarSlots = entry.grammarSlots.filter(s => s.id !== slotId)
    })
  }

  function nudgeSlot(wordIndex, slotId, axis, delta) {
    updateEntry(wordIndex, entry => {
      const slot = entry.grammarSlots.find(s => s.id === slotId)
      if (slot) slot[axis] = Math.round(Math.max(0, Math.min(100, slot[axis] + delta)) * 10) / 10
    })
  }

  function nudgeSlotScale(wordIndex, slotId, delta) {
    updateEntry(wordIndex, entry => {
      const slot = entry.grammarSlots.find(s => s.id === slotId)
      if (slot) slot.scale = Math.round(Math.max(0.3, Math.min(3, (slot.scale ?? 1) + delta)) * 10) / 10
    })
  }

  function updateSlotCategory(wordIndex, slotId, category) {
    updateEntry(wordIndex, entry => {
      const slot = entry.grammarSlots.find(s => s.id === slotId)
      if (slot) slot.category = category
    })
  }

  // ── Save ─────────────────────────────────────────────────────
  async function saveDesign() {
    setSaving(true)
    try {
      const res = await fetch('/__celestial-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(design),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch {}
    setSaving(false)
  }

  async function saveSequence() {
    setSeqSaving(true)
    try {
      const res = await fetch('/__phase1-sequence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sequence),
      })
      if (res.ok) {
        setSeqSaved(true)
        setTimeout(() => setSeqSaved(false), 2000)
      }
    } catch {}
    setSeqSaving(false)
  }

  // ── Stage navigator ──────────────────────────────────────────
  function jumpTo(wordIndex, phase) {
    setNavWordIndex(wordIndex)
    setNavPhase(phase)
    onJumpTo?.({ wordIndex, phase })
  }

  function reg(key) {
    return el => { sectionRefs.current[key] = el }
  }

  // Current entry / word for stage-aware sections
  const currentEntry  = sequence[navWordIndex]
  const currentWord   = allWords.find(w => w.id === currentEntry?.wordId)
  const currentLane   = PHASE_TO_LANE[navPhase] ?? null

  // Words revealed up to and including navWordIndex (for slot preview)
  const revealedWords = sequence
    .slice(0, navWordIndex + 1)
    .map(e => allWords.find(w => w.id === e.wordId))
    .filter(Boolean)

  function copy(text) {
    navigator.clipboard?.writeText(text).catch(() => {})
  }

  return (
    <>
      {!workspace && (
        <button className="ced-toggle" onClick={() => setOpen(o => !o)}>
          {open ? '✕ editor' : 'E  edit'}
        </button>
      )}

      {open && (
        <div className={workspace ? 'ced-panel ced-panel--workspace' : 'ced-panel'}>
          <div className="ced-header">Celestial Editor{workspace ? ' — click any element' : ''}</div>

          {/* Stage navigator */}
          <div className="ced-stage-nav">
            {sequence.map((entry, i) => {
              const wordObj = allWords.find(w => w.id === entry.wordId)
              const label   = wordObj?.baseForm ?? entry.wordId
              const isWordActive  = navWordIndex === i && navPhase !== 'transition'
              const isTransActive = navWordIndex === i && navPhase === 'transition'
              return (
                <span key={entry.wordId} className="ced-stage-group">
                  <button
                    className={`ced-stage-word-btn${isWordActive ? ' ced-stage-word-btn--active' : ''}`}
                    onClick={() => jumpTo(i, 'arriving')}
                    title={`Word ${i + 1}: ${label}`}
                  >
                    {i + 1}
                    <span className="ced-stage-word-label">{label}</span>
                  </button>
                  {i < sequence.length - 1 && (
                    <button
                      className={`ced-stage-trans-btn${isTransActive ? ' ced-stage-trans-btn--active' : ''}`}
                      onClick={() => jumpTo(i, 'transition')}
                      title={`Transition after word ${i + 1}`}
                    >
                      →
                    </button>
                  )}
                </span>
              )
            })}
          </div>

          {/* Phase buttons for current word */}
          <div className="ced-phase-nav">
            {['arriving','writing','listening','speaking','sentence','transition'].map(ph => (
              <button
                key={ph}
                className={`ced-phase-btn${navPhase === ph || (ph === 'arriving' && navPhase === 'reading_ack') ? ' ced-phase-btn--active' : ''}`}
                onClick={() => jumpTo(navWordIndex, ph)}
              >
                {ph}
              </button>
            ))}
          </div>

          <div className="ced-body">

            {/* ── Word accumulation preview ──────────────────── */}
            <Section label="Word accumulation preview">
              <Row label="show all">
                <button
                  className={`ced-ghost-toggle${ghost.enabled ? ' ced-ghost-toggle--on' : ''}`}
                  onClick={() => setGhost(g => ({ ...g, enabled: !g.enabled }))}
                >
                  {ghost.enabled ? 'on' : 'off'}
                </button>
              </Row>
              {ghost.enabled && (
                <>
                  <Row label="past opacity">
                    <div className="ced-slider-wrap">
                      <input
                        className="ced-slider"
                        type="range" min={0} max={1} step={0.05}
                        value={ghost.opacity}
                        onChange={e => setGhost(g => ({ ...g, opacity: Number(e.target.value) }))}
                      />
                      <span className="ced-slider-val">{ghost.opacity.toFixed(2)}</span>
                    </div>
                  </Row>
                  <Row label="wrap">
                    <button
                      className={`ced-ghost-toggle${ghost.wrap ? ' ced-ghost-toggle--on' : ''}`}
                      onClick={() => setGhost(g => ({ ...g, wrap: !g.wrap }))}
                    >
                      {ghost.wrap ? 'wrap' : 'single line'}
                    </button>
                  </Row>
                  <div className="ced-ghost-hint">
                    Jump to word 4 or 5 to see accumulation
                  </div>
                </>
              )}
            </Section>

            {/* ── Stage Content ──────────────────────────────── */}
            <Section label={`Stage Content — "${currentWord?.baseForm ?? '?'}" · ${currentLane ?? navPhase}`} sectionRef={reg('stageContent')} flash={flashKey.stageContent}>
              <div className="ced-content-row">
                <span className="ced-content-label">word</span>
                <span className="ced-content-value">{currentWord?.baseForm ?? '—'}</span>
                <button className="ced-copy-btn" onClick={() => copy(currentWord?.baseForm ?? '')}>copy</button>
              </div>
              <div className="ced-content-row">
                <span className="ced-content-label">meaning</span>
                <span className="ced-content-value ced-content-value--muted">{currentWord?.meaning ?? '—'}</span>
                <button className="ced-copy-btn" onClick={() => copy(currentWord?.meaning ?? '')}>copy</button>
              </div>
              <div className="ced-content-row">
                <span className="ced-content-label">unlock</span>
                <input
                  className="ced-content-input"
                  value={currentEntry?.functionUnlocked ?? ''}
                  onChange={e => updateFunctionUnlocked(navWordIndex, e.target.value)}
                />
                <button className="ced-copy-btn" onClick={() => copy(currentEntry?.functionUnlocked ?? '')}>copy</button>
              </div>

              {/* Sentences for current lane */}
              {currentLane && (
                <div className="ced-sentences">
                  <div className="ced-sentences-label">{currentLane} sentences</div>
                  {(currentEntry?.sentences?.[currentLane] ?? []).map((s, si) => (
                    <div key={si} className="ced-sentence-row">
                      <input
                        className="ced-sentence-input"
                        value={s.text}
                        onChange={e => updateSentence(navWordIndex, currentLane, si, e.target.value)}
                      />
                      <button className="ced-copy-btn" onClick={() => copy(s.text)}>copy</button>
                      <button className="ced-remove-btn" onClick={() => removeSentence(navWordIndex, currentLane, si)}>×</button>
                    </div>
                  ))}
                  <button className="ced-add-btn" onClick={() => addSentence(navWordIndex, currentLane)}>+ sentence</button>
                </div>
              )}
            </Section>

            {/* ── Grammar Slots ──────────────────────────────── */}
            <Section label={`Grammar Slots — "${currentWord?.baseForm ?? '?'}"`} sectionRef={reg('grammarSlots')} flash={flashKey.grammarSlots}>
              {(currentEntry?.grammarSlots ?? []).map(slot => {
                const available = revealedWords.filter(w => w.classifications?.grammaticalCategory === slot.category)
                return (
                  <div key={slot.id} className="ced-slot-row">
                    <div className="ced-slot-top">
                      <select
                        className="ced-slot-cat"
                        value={slot.category}
                        onChange={e => updateSlotCategory(navWordIndex, slot.id, e.target.value)}
                      >
                        {SLOT_CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{s.common.categories[cat] ?? cat}</option>
                        ))}
                      </select>
                      <span className="ced-slot-count">{available.length} word{available.length !== 1 ? 's' : ''}</span>
                      <button className="ced-remove-btn" onClick={() => removeSlot(navWordIndex, slot.id)}>×</button>
                    </div>
                    <div className="ced-slot-pos">
                      <SlotAxisNudge
                        axis="y"
                        value={slot.y}
                        onDec={() => nudgeSlot(navWordIndex, slot.id, 'y', -1)}
                        onInc={() => nudgeSlot(navWordIndex, slot.id, 'y', +1)}
                      />
                      <SlotAxisNudge
                        axis="x"
                        value={slot.x}
                        onDec={() => nudgeSlot(navWordIndex, slot.id, 'x', -1)}
                        onInc={() => nudgeSlot(navWordIndex, slot.id, 'x', +1)}
                      />
                      <SlotAxisNudge
                        axis="size"
                        value={slot.scale ?? 1}
                        display={`${((slot.scale ?? 1) * 100).toFixed(0)}%`}
                        onDec={() => nudgeSlotScale(navWordIndex, slot.id, -0.1)}
                        onInc={() => nudgeSlotScale(navWordIndex, slot.id, +0.1)}
                      />
                    </div>
                    {/* Inline preview */}
                    <div className="ced-slot-preview">
                      <GrammarSlot
                        category={slot.category}
                        words={available}
                        x={0} y={0}
                        editorMode
                      />
                    </div>
                  </div>
                )
              })}
              <AddSlotRow onAdd={cat => addSlot(navWordIndex, cat)} categories={SLOT_CATEGORIES} strings={s} />
            </Section>

            {/* ── Save sequence ──────────────────────────────── */}
            <div className="ced-seq-save-row">
              <button className="ced-save ced-save--inline" onClick={saveSequence} disabled={seqSaving}>
                {seqSaving ? 'Saving…' : seqSaved ? '✓ Saved' : 'Save sequence to file'}
              </button>
            </div>

            {/* ── Visual design sections ─────────────────────── */}
            <Section label="Word" sectionRef={reg('word')} flash={flashKey.word}>
              <FontRow label="font" value={design.word.fontFamily} onChange={v => update(['word', 'fontFamily'], v)} />
              <Row label="size">
                <Stepper value={design.word.fontSize} onChange={v => update(['word', 'fontSize'], v)} min={8} max={200} step={2} />
              </Row>
              <Row label="weight">
                <WeightToggle value={design.word.fontWeight} onChange={v => update(['word', 'fontWeight'], v)} />
              </Row>
              <Row label="spacing">
                <SpacingSlider value={design.word.letterSpacing} onChange={v => update(['word', 'letterSpacing'], v)} />
              </Row>
              <Row label="position">
                <PositionNudge
                  x={design.word.offsetX} y={design.word.offsetY}
                  onX={d => nudge(['word', 'offsetX'], d)}
                  onY={d => nudge(['word', 'offsetY'], d)}
                />
              </Row>
            </Section>

            <Section label="Meaning" sectionRef={reg('meaning')} flash={flashKey.meaning}>
              <FontRow label="font" value={design.meaning.fontFamily} onChange={v => update(['meaning', 'fontFamily'], v)} />
              <Row label="size">
                <Stepper value={design.meaning.fontSize} onChange={v => update(['meaning', 'fontSize'], v)} min={8} max={80} step={1} />
              </Row>
              <Row label="opacity">
                <Slider value={design.meaning.opacity} onChange={v => update(['meaning', 'opacity'], Number(v))} />
              </Row>
            </Section>

            <Section label="Banner" sectionRef={reg('banner')} flash={flashKey.banner}>
              <Row label="position">
                <PositionNudge
                  top={design.banner.topPx} left={design.banner.leftOffsetPx}
                  onTop={d => nudge(['banner', 'topPx'], d)}
                  onLeft={d => nudge(['banner', 'leftOffsetPx'], d)}
                />
              </Row>
              <FontRow label="title font" value={design.banner.titleFontFamily} onChange={v => update(['banner', 'titleFontFamily'], v)} />
              <Row label="title size">
                <Stepper value={design.banner.titleSize} onChange={v => update(['banner', 'titleSize'], v)} min={8} max={80} step={1} />
              </Row>
              <Row label="title weight">
                <WeightToggle value={design.banner.titleWeight} onChange={v => update(['banner', 'titleWeight'], v)} />
              </Row>
              <Row label="title opacity">
                <Slider value={design.banner.titleOpacity} onChange={v => update(['banner', 'titleOpacity'], Number(v))} />
              </Row>
              <FontRow label="subtitle font" value={design.banner.subtitleFontFamily} onChange={v => update(['banner', 'subtitleFontFamily'], v)} />
              <Row label="subtitle size">
                <Stepper value={design.banner.subtitleSize} onChange={v => update(['banner', 'subtitleSize'], v)} min={8} max={60} step={1} />
              </Row>
              <Row label="subtitle opacity">
                <Slider value={design.banner.subtitleOpacity} onChange={v => update(['banner', 'subtitleOpacity'], Number(v))} />
              </Row>
            </Section>

            <Section label="Function Unlock" sectionRef={reg('functionUnlock')} flash={flashKey.functionUnlock}>
              <FontRow label="font" value={design.functionUnlock.fontFamily} onChange={v => update(['functionUnlock', 'fontFamily'], v)} />
              <Row label="size">
                <Stepper value={design.functionUnlock.fontSize} onChange={v => update(['functionUnlock', 'fontSize'], v)} min={8} max={80} step={1} />
              </Row>
              <Row label="weight">
                <WeightToggle value={design.functionUnlock.fontWeight} onChange={v => update(['functionUnlock', 'fontWeight'], v)} />
              </Row>
              <Row label="opacity">
                <Slider value={design.functionUnlock.opacity} onChange={v => update(['functionUnlock', 'opacity'], Number(v))} />
              </Row>
              <Row label="position">
                <PositionNudge
                  x={design.functionUnlock.offsetX} y={design.functionUnlock.offsetY}
                  onX={d => nudge(['functionUnlock', 'offsetX'], d)}
                  onY={d => nudge(['functionUnlock', 'offsetY'], d)}
                />
              </Row>
              <Row label="sound">
                <span className="ced-coming-soon">sound system coming</span>
              </Row>
            </Section>

            <Section label="Lane Stamp" sectionRef={reg('laneStamp')} flash={flashKey.laneStamp}>
              <Row label="position">
                <PositionNudge
                  x={design.laneStamp.offsetX} y={design.laneStamp.offsetY}
                  onX={d => nudge(['laneStamp', 'offsetX'], d)}
                  onY={d => nudge(['laneStamp', 'offsetY'], d)}
                />
              </Row>
              <Row label="sound">
                <span className="ced-coming-soon">sound system coming</span>
              </Row>
            </Section>

            <Section label="Mic" sectionRef={reg('mic')} flash={flashKey.mic}>
              <Row label="size (px)">
                <NumInput value={design.mic.sizePx} onChange={v => update(['mic', 'sizePx'], Number(v))} min={24} max={120} />
              </Row>
              <Row label="position">
                <PositionNudge
                  x={design.mic.offsetX} y={design.mic.offsetY}
                  onX={d => nudge(['mic', 'offsetX'], d)}
                  onY={d => nudge(['mic', 'offsetY'], d)}
                />
              </Row>
            </Section>

            <Section label="Sentence Phase" sectionRef={reg('sentencePhase')} flash={flashKey.sentencePhase}>
              <Row label="word top %">
                <div className="ced-stepper">
                  <button onClick={() => nudge(['sentencePhase', 'floatingWordTopPct'], -1)}>↑</button>
                  <span className="ced-stepper-val">{design.sentencePhase.floatingWordTopPct}%</span>
                  <button onClick={() => nudge(['sentencePhase', 'floatingWordTopPct'], +1)}>↓</button>
                </div>
              </Row>
              <Row label="slots top %">
                <div className="ced-stepper">
                  <button onClick={() => nudge(['sentencePhase', 'slotRowTopPct'], -1)}>↑</button>
                  <span className="ced-stepper-val">{design.sentencePhase.slotRowTopPct}%</span>
                  <button onClick={() => nudge(['sentencePhase', 'slotRowTopPct'], +1)}>↓</button>
                </div>
              </Row>
              <Row label="box padding ↕">
                <div className="ced-stepper">
                  <button onClick={() => nudge(['sentencePhase', 'slotPaddingV'], -1)}>−</button>
                  <span className="ced-stepper-val">{design.sentencePhase.slotPaddingV ?? 8}px</span>
                  <button onClick={() => nudge(['sentencePhase', 'slotPaddingV'], +1)}>+</button>
                </div>
              </Row>
              <Row label="box padding ↔">
                <div className="ced-stepper">
                  <button onClick={() => nudge(['sentencePhase', 'slotPaddingH'], -1)}>−</button>
                  <span className="ced-stepper-val">{design.sentencePhase.slotPaddingH ?? 4}px</span>
                  <button onClick={() => nudge(['sentencePhase', 'slotPaddingH'], +1)}>+</button>
                </div>
              </Row>
              <Row label="box gap">
                <div className="ced-stepper">
                  <button onClick={() => nudge(['sentencePhase', 'slotGap'], -1)}>−</button>
                  <span className="ced-stepper-val">{design.sentencePhase.slotGap ?? 6}px</span>
                  <button onClick={() => nudge(['sentencePhase', 'slotGap'], +1)}>+</button>
                </div>
              </Row>
              <Row label="box font">
                <div className="ced-stepper">
                  <button onClick={() => nudge(['sentencePhase', 'slotFontSize'], -1)}>−</button>
                  <span className="ced-stepper-val">{design.sentencePhase.slotFontSize ?? 13}px</span>
                  <button onClick={() => nudge(['sentencePhase', 'slotFontSize'], +1)}>+</button>
                </div>
              </Row>
            </Section>

            <Section label="Timing — save + reload" sectionRef={reg('timing')} flash={flashKey.timing}>
              <Row label="word arrives ms">
                <NumInput value={design.timing.wordArrivesMs} onChange={v => update(['timing', 'wordArrivesMs'], Number(v))} min={0} />
              </Row>
              <Row label="arriving phase ms">
                <NumInput value={design.timing.arrivingDurationMs} onChange={v => update(['timing', 'arrivingDurationMs'], Number(v))} min={0} />
              </Row>
              <Row label="reading ack ms">
                <NumInput value={design.timing.readingAckDurationMs} onChange={v => update(['timing', 'readingAckDurationMs'], Number(v))} min={0} />
              </Row>
              <Row label="listening advance ms">
                <NumInput value={design.timing.listeningAdvanceMs} onChange={v => update(['timing', 'listeningAdvanceMs'], Number(v))} min={0} />
              </Row>
              <Row label="transition ms">
                <NumInput value={design.timing.transitionDurationMs} onChange={v => update(['timing', 'transitionDurationMs'], Number(v))} min={0} />
              </Row>
            </Section>

          </div>

          <button className="ced-save" onClick={saveDesign} disabled={saving}>
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save design to file'}
          </button>
        </div>
      )}
    </>
  )
}

// ── AddSlotRow ───────────────────────────────────────────────

function AddSlotRow({ onAdd, categories, strings: s }) {
  const [selectedCat, setSelectedCat] = useState(categories[0])
  return (
    <div className="ced-add-slot-row">
      <select
        className="ced-slot-cat"
        value={selectedCat}
        onChange={e => setSelectedCat(e.target.value)}
      >
        {categories.map(cat => (
          <option key={cat} value={cat}>{s.common.categories[cat] ?? cat}</option>
        ))}
      </select>
      <button className="ced-add-btn" onClick={() => onAdd(selectedCat)}>+ add slot</button>
    </div>
  )
}

// ── SlotAxisNudge ─────────────────────────────────────────────
// axis: 'x' | 'y' | 'size'
// For x/y: dec = ← / ↑, inc = → / ↓. For size: − / +.

function SlotAxisNudge({ axis, value, display, onDec, onInc }) {
  const decLabel = axis === 'y' ? '↑' : axis === 'x' ? '←' : '−'
  const incLabel = axis === 'y' ? '↓' : axis === 'x' ? '→' : '+'
  const shown    = display ?? `${value}%`
  return (
    <div className="ced-slot-nudge">
      <span className="ced-slot-nudge-label">{axis}</span>
      <button className="ced-nudge-btn" onClick={onDec}>{decLabel}</button>
      <span className="ced-slot-nudge-val">{shown}</span>
      <button className="ced-nudge-btn" onClick={onInc}>{incLabel}</button>
    </div>
  )
}

// ── Layout primitives ────────────────────────────────────────

function Section({ label, sectionRef, flash, children }) {
  const key   = flash ?? 0
  const elRef = useRef(null)

  useEffect(() => {
    if (!key || !elRef.current) return
    elRef.current.classList.remove('ced-section--flash')
    void elRef.current.offsetWidth
    elRef.current.classList.add('ced-section--flash')
  }, [key])

  return (
    <div
      ref={el => { elRef.current = el; if (sectionRef) sectionRef(el) }}
      className="ced-section"
    >
      <div className="ced-section-label">{label}</div>
      {children}
    </div>
  )
}

function Row({ label, children }) {
  return (
    <div className="ced-row">
      <span className="ced-row-label">{label}</span>
      <div className="ced-row-control">{children}</div>
    </div>
  )
}

function FontRow({ label, value, onChange }) {
  return (
    <div className="ced-font-row">
      <div className="ced-font-row-label">{label}</div>
      <FontPicker value={value} onChange={onChange} />
    </div>
  )
}

// ── Controls ─────────────────────────────────────────────────

function Stepper({ value, onChange, min = 8, max = 200, step = 1 }) {
  return (
    <div className="ced-stepper">
      <button onClick={() => onChange(Math.max(min, value - step))}>−</button>
      <span className="ced-stepper-val">{value}px</span>
      <button onClick={() => onChange(Math.min(max, value + step))}>+</button>
    </div>
  )
}

let _guideTimer = null
function _showGuide() {
  document.body.classList.add('ced-nudging')
  clearTimeout(_guideTimer)
}
function _hideGuide() {
  clearTimeout(_guideTimer)
  _guideTimer = setTimeout(() => document.body.classList.remove('ced-nudging'), 80)
}

function PositionNudge({ top, left, x, y, onTop, onLeft, onX, onY, step = 5 }) {
  const isOffset = onX !== undefined
  const vVal  = isOffset ? y   : top
  const hVal  = isOffset ? x   : left
  const onUp  = isOffset ? () => onY(-step) : () => onTop(-step)
  const onDn  = isOffset ? () => onY(+step) : () => onTop(+step)
  const onLt  = isOffset ? () => onX(-step) : () => onLeft(-step)
  const onRt  = isOffset ? () => onX(+step) : () => onLeft(+step)
  const vLabel = isOffset ? '↕' : '↕ top'
  const hLabel = isOffset ? '↔' : '↔ left'
  const fmt = v => v === 0 ? '0px' : v > 0 ? `+${v}px` : `${v}px`

  const np = { onPointerDown: _showGuide, onPointerUp: _hideGuide, onPointerLeave: _hideGuide }

  return (
    <div className="ced-nudge">
      <div className="ced-nudge-row">
        <span className="ced-nudge-axis-label">{vLabel}</span>
        <button className="ced-nudge-btn" onClick={onUp} {...np}>↑</button>
        <span className="ced-nudge-val">{fmt(vVal)}</span>
        <button className="ced-nudge-btn" onClick={onDn} {...np}>↓</button>
      </div>
      <div className="ced-nudge-row">
        <span className="ced-nudge-axis-label">{hLabel}</span>
        <button className="ced-nudge-btn" onClick={onLt} {...np}>←</button>
        <span className="ced-nudge-val">{fmt(hVal)}</span>
        <button className="ced-nudge-btn" onClick={onRt} {...np}>→</button>
      </div>
    </div>
  )
}

function WeightToggle({ value, onChange }) {
  return (
    <div className="ced-weight-toggle">
      {WEIGHTS.map(w => (
        <button
          key={w.value}
          className={`ced-weight-btn${value === w.value ? ' ced-weight-btn--active' : ''}`}
          onClick={() => onChange(w.value)}
        >
          {w.label}
        </button>
      ))}
    </div>
  )
}

function SpacingSlider({ value, onChange }) {
  return (
    <div className="ced-spacing-wrap">
      <span className="ced-spacing-end">tight</span>
      <input
        className="ced-slider"
        type="range" min={-0.1} max={0.3} step={0.005}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
      />
      <span className="ced-spacing-end">loose</span>
    </div>
  )
}

function Slider({ value, onChange }) {
  return (
    <div className="ced-slider-wrap">
      <input
        className="ced-slider"
        type="range" min={0} max={1} step={0.01}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      <span className="ced-slider-val">{Number(value).toFixed(2)}</span>
    </div>
  )
}

function NumInput({ value, onChange, min, max, step = 1 }) {
  return (
    <input
      className="ced-num-input"
      type="number" value={value}
      onChange={e => onChange(e.target.value)}
      min={min} max={max} step={step}
    />
  )
}

function FontPicker({ value, onChange }) {
  return (
    <div className="ced-font-picker">
      {FONTS.map(f => (
        <button
          key={f.name ?? 'default'}
          className={`ced-font-option${value === f.name ? ' ced-font-option--active' : ''}`}
          style={{ fontFamily: f.name ?? 'inherit' }}
          onClick={() => onChange(f.name)}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}
