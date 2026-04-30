// Grammar Clustering — English A1
//
// Groups grammar atoms into clusters — coarser stages that answer:
// "what level of grammatical complexity can this learner handle?"
//
// Clusters are the lens through which getLearnerGrammarState() organizes
// the word bank. They drive content complexity across all 4 lanes
// simultaneously. They are NOT a teaching sequence shown to users.
//
// Completion condition: all atoms in the cluster have at least one banked word
// (i.e. the pioneer for each atom has been taken). extraRequirements is a hook
// for additional advancement gates (e.g. minimum vocab depth) — null until needed.
//
// Pedagogical note: cluster order reflects how structures are actually acquired,
// not theoretical structural complexity. "I am eating" is Cluster 4 (A1) because
// learners produce it naturally and early. "I have eaten" is A2 — the concept
// of indefinite past relevance is genuinely harder to grasp even implicitly.
//
// progressive_auxiliary: structure-unlock (new construction on 'be' already banked).
// perfect_auxiliary: not in A1 — belongs in A2 cluster file.

export const GRAMMAR_CLUSTERS = [
  {
    id:          1,
    label:       'Base clause',
    description: 'Base clause + formulaic survival',
    atoms:       ['personal_pronoun', 'lexical_verb', 'noun', 'object_pronoun', 'interjection'],
    extraRequirements: null,
  },
  {
    id:          2,
    label:       'Identity + description',
    description: 'Identity, description, reference + early questions',
    atoms:       ['copula', 'adjective', 'determiner', 'possessive_determiner', 'demonstrative', 'numeral', 'interrogative'],
    extraRequirements: null,
  },
  {
    id:          3,
    label:       'Clause expansion',
    description: 'Clause expansion — widens without changing sentence type',
    atoms:       ['adverb', 'preposition', 'coordinating_conjunction'],
    extraRequirements: null,
  },
  {
    id:          4,
    label:       'Stance + control',
    description: 'Stance, control, do-support questions + progressive',
    atoms:       ['modal_auxiliary', 'negation_marker', 'auxiliary', 'progressive_auxiliary'],
    extraRequirements: null,
  },
]
