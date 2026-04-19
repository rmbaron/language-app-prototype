import { useState, useEffect, useRef } from 'react'
import celestialDesign from './celestialDesign'
import { applyDesignToDOM } from './applyDesign'
import { getPhase1Sequence } from './phase1Sequence'
import { getActiveLanguage } from './learnerProfile'
import allWords from './wordData'

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

// Maps a clicked Celestial element to an editor section key
const ELEMENT_SECTION_MAP = [
  { selector: '.celestial-word-wrap',  section: 'word'           },
  { selector: '.celestial-meaning',    section: 'meaning'        },
  { selector: '.moment-banner',        section: 'banner'         },
  { selector: '.function-unlock',      section: 'functionUnlock' },
  { selector: '.lane-stamp',           section: 'laneStamp'      },
  { selector: '.celestial-mic-wrap',   section: 'mic'            },
]

export default function CelestialEditor({ workspace = false, onJumpTo }) {
  const [open,      setOpen]      = useState(true)   // start open in workspace mode
  const [design,    setDesign]    = useState(() => structuredClone(celestialDesign))
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [flashKey,  setFlashKey]  = useState({})   // { sectionKey: counter } triggers re-flash

  // Stage navigator state — tracks which word+phase is selected
  const [navWordIndex, setNavWordIndex] = useState(0)
  const [navPhase,     setNavPhase]     = useState('arriving')

  const activeLang = getActiveLanguage()
  const sequence   = getPhase1Sequence(activeLang)

  const sectionRefs = useRef({})

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

  // Click-to-select: when editor is open, clicks on Celestial elements scroll + flash the section
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

  async function save() {
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

  function jumpTo(wordIndex, phase) {
    setNavWordIndex(wordIndex)
    setNavPhase(phase)
    onJumpTo?.({ wordIndex, phase })
  }

  function reg(key) {
    return el => { sectionRefs.current[key] = el }
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

          {/* Stage navigator — word chips + transition chips */}
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

          <div className="ced-body">

            <Section label="Word" sectionRef={reg('word')} flash={flashKey.word}>
              <FontRow
                label="font"
                value={design.word.fontFamily}
                onChange={v => update(['word', 'fontFamily'], v)}
              />
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
              <FontRow
                label="font"
                value={design.meaning.fontFamily}
                onChange={v => update(['meaning', 'fontFamily'], v)}
              />
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
                  top={design.banner.topPx}
                  left={design.banner.leftOffsetPx}
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

          <button className="ced-save" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save to file'}
          </button>
        </div>
      )}
    </>
  )
}

// ── Layout primitives ────────────────────────────────────────

function Section({ label, sectionRef, flash, children }) {
  const key   = flash ?? 0
  const elRef = useRef(null)

  // Re-trigger flash animation each time flash counter increments
  useEffect(() => {
    if (!key || !elRef.current) return
    elRef.current.classList.remove('ced-section--flash')
    void elRef.current.offsetWidth  // force reflow
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
  // Supports two modes: banner (top/left absolute) or element (x/y offset)
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
