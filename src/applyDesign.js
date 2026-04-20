// Applies a celestialDesign config object to the DOM as CSS custom properties.
// Call this on mount (to apply saved config) and on every editor change (live preview).

function applyFont(s, varName, fontFamily) {
  if (fontFamily) {
    s.setProperty(varName, `'${fontFamily}', system-ui, sans-serif`)
  } else {
    s.removeProperty(varName)
  }
}

export function applyDesignToDOM(design) {
  const s = document.documentElement.style

  // Word
  applyFont(s, '--ced-word-font',            design.word.fontFamily)
  s.setProperty('--ced-word-size',           `${design.word.fontSize}px`)
  s.setProperty('--ced-word-weight',         String(design.word.fontWeight))
  s.setProperty('--ced-word-letter-spacing', `${design.word.letterSpacing}em`)
  s.setProperty('--ced-word-offset-x',       `${design.word.offsetX ?? 0}px`)
  s.setProperty('--ced-word-offset-y',       `${design.word.offsetY ?? 0}px`)

  // Meaning
  applyFont(s, '--ced-meaning-font',       design.meaning.fontFamily)
  s.setProperty('--ced-meaning-size',        `${design.meaning.fontSize}px`)
  s.setProperty('--ced-meaning-opacity',     String(design.meaning.opacity))

  // Banner
  s.setProperty('--ced-banner-top',         `${design.banner.topPx}px`)
  s.setProperty('--ced-banner-left-offset', `${design.banner.leftOffsetPx}px`)
  applyFont(s, '--ced-banner-title-font',    design.banner.titleFontFamily)
  s.setProperty('--ced-banner-title-size',        `${design.banner.titleSize}px`)
  s.setProperty('--ced-banner-title-weight',      String(design.banner.titleWeight))
  s.setProperty('--ced-banner-title-opacity',     String(design.banner.titleOpacity))
  applyFont(s, '--ced-banner-subtitle-font', design.banner.subtitleFontFamily)
  s.setProperty('--ced-banner-subtitle-size',     `${design.banner.subtitleSize}px`)
  s.setProperty('--ced-banner-subtitle-opacity',  String(design.banner.subtitleOpacity))

  // Function unlock
  applyFont(s, '--ced-fn-unlock-font',     design.functionUnlock.fontFamily)
  s.setProperty('--ced-fn-unlock-size',    `${design.functionUnlock.fontSize}px`)
  s.setProperty('--ced-fn-unlock-weight',  String(design.functionUnlock.fontWeight))
  s.setProperty('--ced-fn-unlock-opacity', String(design.functionUnlock.opacity))
  s.setProperty('--ced-fn-unlock-offset-x', `${design.functionUnlock.offsetX ?? 0}px`)
  s.setProperty('--ced-fn-unlock-offset-y', `${design.functionUnlock.offsetY ?? 0}px`)

  // Lane stamp
  s.setProperty('--ced-lane-stamp-offset-x', `${design.laneStamp.offsetX ?? 0}px`)
  s.setProperty('--ced-lane-stamp-offset-y', `${design.laneStamp.offsetY ?? 0}px`)

  // Mic
  s.setProperty('--ced-mic-size',     `${design.mic.sizePx}px`)
  s.setProperty('--ced-mic-offset-x', `${design.mic.offsetX ?? 0}px`)
  s.setProperty('--ced-mic-offset-y', `${design.mic.offsetY ?? 0}px`)

  // Sentence phase positions
  const sp = design.sentencePhase
  if (sp) {
    s.setProperty('--ced-sentence-word-top',  `${sp.floatingWordTopPct ?? 33}%`)
    s.setProperty('--ced-sentence-slots-top', `${sp.slotRowTopPct ?? 67}%`)
    s.setProperty('--ced-slot-padding-v',     `${sp.slotPaddingV ?? 8}px`)
    s.setProperty('--ced-slot-padding-h',     `${sp.slotPaddingH ?? 4}px`)
    s.setProperty('--ced-slot-gap',           `${sp.slotGap ?? 6}px`)
    s.setProperty('--ced-slot-font-size',     `${sp.slotFontSize ?? 13}px`)
  }
}
