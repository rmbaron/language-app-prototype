// English progression stages for the slot-fill Practice mechanic.
//
// Stages are ADDITIVE — each stage defines only the new frames it unlocks.
// The Practice screen unions all frames from all currently unlocked stages.
//
// Gate types:
//   requiredWords      — word IDs that must be in graduated (worldPools union)
//   requiredCategories — [{ category, min }] — need at least min words of that
//                        grammaticalCategory graduated
//
// Frame slot fields:
//   label — displayed above the slot (e.g. "Subject", "Verb")
//   fills — grammaticalCategory values that can fill this slot
//
// All thresholds here are adjustable. The slot UI reads this config and
// never hardcodes any of these values.

export const STAGES = [
  {
    id: 'stage_1',
    name: 'First words',
    description: 'Feel the most basic structure — someone doing something.',
    gate: {
      requiredWords: ['i'],
      requiredCategories: [
        { category: 'verb', min: 1 },
      ],
    },
    frames: [
      {
        id: 'subject_verb',
        label: 'Subject + Verb',
        slots: [
          { label: 'Subject', fills: ['pronoun'] },
          { label: 'Verb',    fills: ['verb']    },
        ],
      },
    ],
  },

  {
    id: 'stage_2',
    name: 'Someone to talk to',
    description: 'Direct your words at another person or thing.',
    gate: {
      requiredCategories: [
        { category: 'pronoun', min: 2 },
        { category: 'verb',    min: 2 },
      ],
    },
    frames: [
      {
        id: 'subject_verb_object',
        label: 'Subject + Verb + Object',
        slots: [
          { label: 'Subject', fills: ['pronoun'] },
          { label: 'Verb',    fills: ['verb']    },
          { label: 'Object',  fills: ['pronoun'] },
        ],
      },
    ],
  },

  {
    id: 'stage_3',
    name: 'Describing',
    description: 'Add a quality or color to what you say.',
    gate: {
      requiredCategories: [
        { category: 'adjective', min: 1 },
      ],
    },
    frames: [
      {
        id: 'subject_verb_adjective',
        label: 'Subject + Verb + Describes',
        slots: [
          { label: 'Subject',   fills: ['pronoun']   },
          { label: 'Verb',      fills: ['verb']      },
          { label: 'Describes', fills: ['adjective'] },
        ],
      },
    ],
  },
]
