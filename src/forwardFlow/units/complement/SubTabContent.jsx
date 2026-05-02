// Complement SubTabContent — thin wrapper over the shared SlotAcceptanceView.
// Slot-specific bits: amber color, C chip, comp- prefix, single-structure match.
//
// C was the first unit built directly against the shared structure registry
// (no parallel catalog). The wrapper pattern is the natural endpoint for that.

import { SlotAcceptanceView } from '../../SlotAcceptanceView'
import { STRUCTURES } from '../../structures.en.js'
import { COMPLEMENT_ACCEPTS } from './acceptance.en.js'

const ACCEPTED = STRUCTURES.filter(s => COMPLEMENT_ACCEPTS.includes(s.id))

const INTRO = (
  <>
    C is the first unit built without its own catalog. The structures shown here are pulled from the shared registry (<code>src/forwardFlow/structures.en.js</code>) — defined once, referenced by C's acceptance declaration.
    <br /><br />
    Cs (Subject Complement) appears in SVC frames; Co (Object Complement) in SVOC frames. Both accept the same structure set; the difference is what they predicate over.
  </>
)

export function ComplementSubTabContent({
  complementAnalysis,
  expanded, setExpanded, toggle,
  search, setSearch,
}) {
  const matchedIds = new Set(
    complementAnalysis?.structure ? [complementAnalysis.structure] : []
  )
  return (
    <SlotAcceptanceView
      acceptsList={ACCEPTED}
      colorKey="amber"
      slotShortLabel="C"
      storagePrefix="comp-"
      matchedIds={matchedIds}
      introNode={INTRO}
      expanded={expanded} setExpanded={setExpanded} toggle={toggle}
      search={search} setSearch={setSearch} />
  )
}
