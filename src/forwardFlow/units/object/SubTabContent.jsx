// Object SubTabContent — thin wrapper over the shared SlotAcceptanceView.
// Slot-specific bits: green color, O chip, obj- prefix, multi-object match set.

import { SlotAcceptanceView } from '../../SlotAcceptanceView'
import { STRUCTURES } from '../../structures.en.js'
import { OBJECT_ACCEPTS } from './acceptance.en.js'

const ACCEPTED = STRUCTURES.filter(s => OBJECT_ACCEPTS.includes(s.id))

const INTRO = (
  <>
    Object's per-unit shape catalog has been retired — the structures shown here come from the shared registry, just like Subject. Object's acceptance overlaps Subject's almost entirely; "shapes shared across units" empirically confirmed.
  </>
)

export function ObjectSubTabContent({
  lane, objectAnalysis,
  expanded, setExpanded, toggle,
  search, setSearch,
}) {
  const matchedIds = new Set(
    lane === 'fundamental'
      ? (objectAnalysis?.objects ?? []).map(o => o.shape).filter(Boolean)
      : []
  )
  return (
    <SlotAcceptanceView
      acceptsList={ACCEPTED}
      colorKey="green"
      slotShortLabel="O"
      storagePrefix="obj-"
      matchedIds={matchedIds}
      introNode={INTRO}
      expanded={expanded} setExpanded={setExpanded} toggle={toggle}
      search={search} setSearch={setSearch} />
  )
}
