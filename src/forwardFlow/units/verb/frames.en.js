// Verb Argument Structures — English
//
// This file is now a READER, not a hand-edited verb list. Each verb's frames
// are part of the verb itself — they live on the verb's L2 record in the
// word registry. The reader scans the registry for verbs that have frames
// declared, attaches the shared frame-template metadata, and exports the
// composed array under the same public name (`VERB_ARGUMENT_STRUCTURES`)
// every consumer already imports.
//
// File size is bounded — it does not grow with vocabulary. Adding a new verb
// to the language means enriching the verb's L2 record, not editing this
// file. Pre-API verbs whose L2 hasn't supplied frames yet are covered by
// verbFramesBootstrap.en.js until enrichment lands.
//
// ── What lives here ───────────────────────────────────────────────────────
//   FRAME_TEMPLATES — closed list of frame types in the language. Slot
//                     structure, label, description, slot-level notes. Shared
//                     across all verbs that take a given frame.
//   buildArgumentStructures — composes per-verb assignments + templates.
//   VERB_ARGUMENT_STRUCTURES — public export. Same shape as before:
//     [{ verbId, baseForm, inSeed, frames: [{ id, label, slots, example,
//                                              notes, slotNotes? }] }]
//
// ── Truth note ────────────────────────────────────────────────────────────
// Argument structure is an intrinsic linguistic property of the verb, not a
// curatorial choice. "Eat" objectively can be intransitive or transitive;
// "give" objectively requires three arguments; "live" objectively requires a
// locative complement. That is why frames belong on the verb, not in a
// separate ledger.
//
// Source of truth for the macro-layer architecture: notes/macro-layer-sketch.md
// Router: framesIndex.js

import { getAllWords } from '../../../wordRegistry'
import { VERB_FRAMES_BOOTSTRAP } from './verbFramesBootstrap.en.js'

// ── Frame templates ──────────────────────────────────────────────────────
// Closed list — the set of frame types English permits at the macro layer.
// New frame types land here once; verbs reference them by id.
const FRAME_TEMPLATES = {
  intransitive: {
    label:       'Intransitive',
    slots:       ['S', 'V'],
    description: 'Verb takes only a subject. No object, no complement, no obligatory adverbial.',
  },
  transitive: {
    label:       'Transitive',
    slots:       ['S', 'V', 'O'],
    description: 'Verb takes a subject and a single direct object.',
  },
  ditransitive: {
    label:       'Ditransitive (SVOO)',
    slots:       ['S', 'V', 'O', 'O'],
    description: 'Two objects: indirect (recipient) before direct (theme).',
    slotNotes:   { 2: 'Indirect Object (recipient)', 3: 'Direct Object (theme)' },
  },
  'dative-shift': {
    label:       'Dative shift (SVOA)',
    slots:       ['S', 'V', 'O', 'A'],
    description: 'Direct object precedes a to-PP encoding the recipient. Same meaning as ditransitive, different surface arrangement.',
    slotNotes:   { 2: 'Direct Object (theme)', 3: 'Obligatory adverbial — to-PP (recipient)' },
  },
  'locative-required': {
    label:       'Locative-required (SVA)',
    slots:       ['S', 'V', 'A'],
    description: 'Verb demands a locative adverbial as an obligatory argument, not a free adjunct.',
    slotNotes:   { 2: 'Obligatory locative adverbial' },
  },
  'svoa-required': {
    label:       'Required-SVOA',
    slots:       ['S', 'V', 'O', 'A'],
    description: 'Verb demands both an object and a locative adverbial as obligatory arguments.',
    slotNotes:   { 3: 'Obligatory locative adverbial — destination of placement' },
  },
  'svoc-attributive': {
    label:       'Attributive (SVOC)',
    slots:       ['S', 'V', 'O', 'C'],
    description: 'Object Complement attributes a property to the object. The complement predicates over the object, not the subject.',
    slotNotes:   { 3: 'Object Complement (Co) — predicates over the Object' },
  },
  copular: {
    label:       'Copular (SVC)',
    slots:       ['S', 'V', 'C'],
    description: 'Linking verb (be, seem, become, etc.) connects the subject to a complement that predicates over it.',
    slotNotes:   { 2: 'Subject Complement (Cs) — predicates over the Subject. Can be AdjP ("happy"), NP ("a teacher"), or PP ("in the garden")' },
  },
}

// ── Composer ─────────────────────────────────────────────────────────────
// Combines a verb's compact frame assignments (from L2 or bootstrap) with
// the shared template metadata. Returns the per-frame records consumers
// already expect.
function composeFrames(assignments) {
  const out = []
  for (const f of assignments) {
    const tmpl = FRAME_TEMPLATES[f.id]
    if (!tmpl) {
      console.warn(`[frames] unknown frame template "${f.id}" — skipping`)
      continue
    }
    out.push({
      id:      f.id,
      label:   tmpl.label,
      slots:   tmpl.slots,
      example: f.example,
      notes:   f.notes ?? tmpl.description,
      ...(tmpl.slotNotes ? { slotNotes: tmpl.slotNotes } : {}),
    })
  }
  return out
}

// ── Reader ───────────────────────────────────────────────────────────────
// Builds the public VERB_ARGUMENT_STRUCTURES from two sources, in order:
//   1. Bootstrap verbs (pre-API) — always included; L2 frames take precedence
//      if the verb has been enriched since.
//   2. L2-enriched verbs not in bootstrap — pure registry-driven entries,
//      the steady state for production verbs after API enrichment matures.
function buildArgumentStructures() {
  const all = getAllWords('en')
  const byBaseForm = new Map(all.map(w => [w.baseForm, w]))
  const records = []

  // 1. Bootstrap entries — pre-API demo verbs. These ride alongside seed
  //    verbs by definition (bootstrap exists for verbs that are in the seed
  //    but haven't been L2-enriched yet), so inSeed is always true here.
  for (const [baseForm, bootstrapFrames] of Object.entries(VERB_FRAMES_BOOTSTRAP)) {
    const verb = byBaseForm.get(baseForm)
    const assignments = verb?.frames ?? bootstrapFrames
    records.push({
      verbId:   baseForm,
      baseForm,
      inSeed:   true,
      frames:   composeFrames(assignments),
    })
  }

  // 2. Post-API verbs — L2 supplied frames; not in bootstrap. The registry
  //    only resolves seed-backed words, so these are always in seed too.
  for (const verb of all) {
    if (!verb.frames)                         continue
    if (VERB_FRAMES_BOOTSTRAP[verb.baseForm]) continue
    records.push({
      verbId:   verb.baseForm,
      baseForm: verb.baseForm,
      inSeed:   true,
      frames:   composeFrames(verb.frames),
    })
  }

  return records
}

export const VERB_ARGUMENT_STRUCTURES = buildArgumentStructures()
