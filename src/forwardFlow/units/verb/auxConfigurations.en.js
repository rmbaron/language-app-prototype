// Verb Aux Cluster Configurations — English
//
// V's six named cluster configurations. Where Subject has alternative shapes
// (pick one) and the V chain has sequenced positions (stack), THIS layer is
// V's catalog of "what kind of cluster is this": which aux position leads
// the chain.
//
// The configurations are not enumerated possibilities — they're compositional
// from the chain positions in internalChain.en.js (M + Perf + Prog + Pass + V,
// plus do-support). What's named here is the LEADING-aux pattern, which is
// what differentiates the configurations at the surface.
//
// ── Record shape ──────────────────────────────────────────────────────────
//   id          — string, machine id
//   label       — human-readable name
//   leading     — chain-position id that leads this configuration (or null for bare)
//   pattern     — string, schematic
//   description — string, what this configuration realizes
//   examples    — array of { sentence, highlight }
//
// Source: session 48 V-unit design work; notes/macro-layer-sketch.md
//
// Router: auxConfigurationsIndex.js

export const AUX_CONFIGURATIONS = [
  {
    id:          'bare',
    label:       'Bare',
    leading:     null,
    pattern:     '[lexical-verb]',
    description: 'No auxiliaries. The lexical verb stands alone and bears subject-verb agreement directly.',
    examples: [
      { sentence: 'She runs.',           highlight: 'runs' },
      { sentence: 'They eat food.',      highlight: 'eat' },
      { sentence: 'I sleep.',            highlight: 'sleep' },
    ],
  },
  {
    id:          'modal_led',
    label:       'Modal-led',
    leading:     'modal',
    pattern:     '[modal] (...) [verb-base]',
    description: 'Modal at the head of the cluster. Projects bare-infinitive form on the next verb. May still be followed by Perfect / Progressive / Passive positions.',
    examples: [
      { sentence: 'She must run.',                 highlight: 'must run' },
      { sentence: 'They will be eating.',          highlight: 'will be eating' },
      { sentence: 'It might have been seen.',      highlight: 'might have been seen' },
    ],
  },
  {
    id:          'perfect_led',
    label:       'Perfect-led',
    leading:     'perfect',
    pattern:     '[have/has/had] (...) [past-participle]',
    description: 'Perfect at the head of the cluster (no modal preceding). Projects past-participle on the next verb. Bears subject-verb agreement (he has, they have).',
    examples: [
      { sentence: 'She has eaten.',                highlight: 'has eaten' },
      { sentence: 'They had been working.',        highlight: 'had been working' },
      { sentence: 'It has been seen.',             highlight: 'has been seen' },
    ],
  },
  {
    id:          'progressive_led',
    label:       'Progressive-led',
    leading:     'be_aux',
    pattern:     '[am/is/are/was/were] [verb-ing]',
    description: 'BE at the head followed by an -ing form. Realizes progressive aspect: action ongoing at the reference time. Surface form (BE) is shared with Passive-led; resolved by the lexical verb form (-ing → Progressive).',
    examples: [
      { sentence: 'She is running.',               highlight: 'is running' },
      { sentence: 'They were eating.',             highlight: 'were eating' },
      { sentence: 'I am reading.',                 highlight: 'am reading' },
    ],
  },
  {
    id:          'passive_led',
    label:       'Passive-led',
    leading:     'be_aux',
    pattern:     '[am/is/are/was/were] [past-participle]',
    description: 'BE at the head followed by a past participle. Realizes passive voice: surface subject is the patient/theme, not the agent. Surface form (BE) is shared with Progressive-led; resolved by the lexical verb form (past participle → Passive).',
    examples: [
      { sentence: 'The food was eaten.',           highlight: 'was eaten' },
      { sentence: 'She is admired.',               highlight: 'is admired' },
      { sentence: 'It was seen.',                  highlight: 'was seen' },
    ],
  },
  {
    id:          'do_support',
    label:       'Do-support',
    leading:     'do_support',
    pattern:     '[do/does/did] [verb-base]',
    description: 'Do/does/did inserted as the operator when no other auxiliary is available to bear negation, question inversion, or emphasis. Not a canonical chain position — a mechanism that creates an operator on demand.',
    examples: [
      { sentence: 'Did you eat?',                  highlight: 'Did eat' },
      { sentence: 'She does not run.',             highlight: 'does not run' },
      { sentence: 'I do eat.',                     highlight: 'do eat' },
    ],
  },
]

// Special detection states (not in the catalog — runtime only).
// Returned by detectAuxConfiguration when ambiguity can't be resolved.
export const BE_LED_AMBIGUOUS = 'be_led_ambiguous'
