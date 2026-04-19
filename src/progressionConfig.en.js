// English progression stages for the slot-fill Practice mechanic.
//
// Stages are ADDITIVE — each stage defines only the new frames it unlocks.
// The Practice screen unions all frames from all currently unlocked stages.
//
// Gate:
//   requiresNodes — grammar node IDs (from grammarProgression.en.js) that must
//                   all be unlocked before this stage is available.
//                   Single source of truth — no duplicate word/category logic here.
//
// Frame fields:
//   id          — unique frame identifier
//   grammarNode — the grammar node this frame practices and graduates
//   label       — displayed above the frame
//   slots       — array of { label, fills: [grammaticalCategory] }
//
// All thresholds live in grammarStore (GRAMMAR_PASS_THRESHOLD).
// The slot UI reads this config and never hardcodes any structural values.

export const STAGES = [
  {
    id: 'stage_1',
    name: 'First words',
    description: 'Feel the most basic structure — someone doing something.',
    gate: { requiresNodes: ['first_person', 'action_verb'] },
    frames: [
      {
        id: 'subject_verb',
        grammarNode: 'action_verb',
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
    gate: { requiresNodes: ['second_person'] },
    frames: [
      {
        id: 'subject_verb_object',
        grammarNode: 'second_person',
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
    gate: { requiresNodes: ['basic_adjective'] },
    frames: [
      {
        id: 'subject_verb_adjective',
        grammarNode: 'basic_adjective',
        label: 'Subject + Verb + Describes',
        slots: [
          { label: 'Subject',   fills: ['pronoun']   },
          { label: 'Verb',      fills: ['verb']      },
          { label: 'Describes', fills: ['adjective'] },
        ],
      },
    ],
  },

  {
    id: 'stage_4',
    name: 'He and she do things',
    description: 'Verbs change form when someone else is doing the action.',
    gate: { requiresNodes: ['third_person_conjugation'] },
    frames: [
      {
        id: 'third_subject_conjugated_verb',
        grammarNode: 'third_person_conjugation',
        label: 'He/She + Verb',
        slots: [
          // specificWords restricts the picker to only these word IDs from the bank
          { label: 'Subject', fills: ['pronoun'], specificWords: ['he', 'she'] },
          // fillsForm pulls the third_person_present form of verbs in the bank
          { label: 'Verb', fillsForm: 'third_person_present', fromCategory: 'verb' },
        ],
      },
    ],
  },
]
