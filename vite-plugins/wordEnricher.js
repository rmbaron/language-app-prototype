import Anthropic from '@anthropic-ai/sdk'
import { ATOMS } from '../src/grammarAtoms.en.js'
import { TENSE_GRID } from '../src/tenseGrid.en.js'

const L1_SYSTEM = `You are classifying words for a language learning app.

Return a JSON object with these fields:
- grammaticalCategory: one of: noun, verb, adjective, adverb, pronoun, determiner, conjunction, preposition, interrogative, demonstrative, negation, interjection, numeral
- meaning: a short definition (5–10 words) suitable for a language learner
- semanticSubtype: a finer label within the category (e.g. noun → person/place/thing/abstract; verb → action/state/motion; adjective → size/quality/emotion/temperature/age; adverb → time/place/manner/frequency)

Reply with only valid JSON. No explanation.`

const L2_SYSTEM = (() => {
  const atomList = ATOMS
    .map(a => `- ${a.id}: ${a.description} (e.g. ${a.examples.slice(0, 3).join(', ')})`)
    .join('\n')
  const tenseList = TENSE_GRID
    .map(t => `- ${t.id}: ${t.name} — ${t.structure} (e.g. "${t.example}")`)
    .join('\n')

  return `You are building detailed linguistic profiles for words in a language learning app.

Grammar atoms — pick the single best one for grammaticalAtom:
${atomList}

Tense grid IDs (used in the "tenses" field on forms):
${tenseList}

Return a JSON object with these fields:
- grammaticalAtom: one atom ID from the list above — the primary grammatical classification
- alternateAtoms: array of { atom, when } for any secondary grammatical functions. "when" is a short phrase (e.g. "used as progressive auxiliary"). Empty array if only one function.
- cefrLevel: earliest CEFR level where this word is useful (e.g. "A1")
- subLevel: earliest sub-level (e.g. "A1.1")
- frequency: "core" | "high" | "medium" | "low" (relative to its CEFR level)
- forms: array of { form, type, tenses } for all inflected forms.
  "type" is the grammatical role: third_person_present, past, past_participle, present_participle, plural, comparative, superlative, object, possessive, reflexive, vowel_variant, contracted_negative, contracted_negative_third, subject_contraction, etc.
  "tenses" is an array of tense grid IDs where this form is used as the lexical verb slot:
    - base form of a lexical verb → ["present_simple","future_simple"] (base is used in both "I drink" and "I will drink")
    - third_person_present → ["present_simple"]
    - past → ["past_simple"]
    - past_participle → ["present_perfect","past_perfect","future_perfect"] (NOT perfect_continuous — those use -ing)
    - present_participle (-ing) → ["present_continuous","past_continuous","future_continuous","present_perfect_continuous","past_perfect_continuous","future_perfect_continuous"]
    - for non-lexical-verb words (nouns, pronouns, adjectives, etc.) set tenses: [] on all forms
  For auxiliary, modal, and copula verbs always include contracted negatives (don't, can't, isn't, etc.) and subject contractions where natural (I'm, you're, he's). Empty forms array if the word does not inflect.
- colloquial: boolean — true ONLY for words that are clearly informal/casual register (wanna, gonna, gimme, ain't, dunno, kinda, yeah). False for everything else, including most everyday words. When in doubt, false.
- lemmaFamily: string — a stable identifier shared by all words in the same derivational family. Use the most basic root form of the family as the ID. Example: "happy", "happiness", "happily" all get lemmaFamily: "happy". "act", "action", "actor", "active", "activate" all get lemmaFamily: "act". For irregular families ("good", "better", "best") use the base of the lemma even though the words look different — lemmaFamily: "good". When a word stands alone with no derivational family, use the word's own baseForm as its lemmaFamily.
- derivedForms: array of { form, category } — every well-known derivational sibling of THIS word in standard contemporary English. "form" is the surface form (lowercase unless a proper noun); "category" is one of: noun, verb, adjective, adverb. List the canonical sibling for each category that exists. Examples:
    "happy" (adjective)  → [{ form: "happily",  category: "adverb" }, { form: "happiness", category: "noun" }]
    "happily" (adverb)   → [{ form: "happy",    category: "adjective" }, { form: "happiness", category: "noun" }]
    "act" (verb)         → [{ form: "action",   category: "noun" }, { form: "actor", category: "noun" }, { form: "active", category: "adjective" }]
    "the" (determiner)   → []
  Empty array if the word has no productive derivational siblings (most function words, irregulars without -ly, etc.). Do NOT include inflectional forms (plurals, past tense, comparative) — those go in "forms". Only derivational siblings that are different lemmas in their own right.
- contentReady: false

Word-class-specific fields — populate the ones that apply to this word's grammaticalCategory; set the others to null:

NOUNS:
- countability: "count" | "mass" | "pluralia_tantum" | "both" | null
  count: ordinary singular/plural noun (cat → cats, book → books)
  mass: uncountable, no plural form, takes singular agreement (water, music, advice, information, weather)
  pluralia_tantum: exists only in plural form, takes plural agreement (scissors, jeans, pants, glasses-eyewear, clothes)
  both: flexes between count and mass depending on context (coffee, glass, chicken, water-in-restaurants)
- properNoun: { type, takesArticle } | null
  Set to null for common nouns. For proper nouns, type is "person" | "place" | "organization" | "temporal" | "language" | "other"; takesArticle is true for proper nouns that require "the" (the United States, the Beatles, the Pacific) and false for typical proper nouns (Mary, London, Microsoft, January).
- concreteness: "concrete" | "abstract" | null
  concrete: perceivable through senses (table, cat, water, music)
  abstract: conceptual, not perceivable (love, hope, time, idea, freedom)
- animate: boolean | null
  true for nouns referring to living beings (man, cat, child, teacher, dog). false for inanimate things (table, book, water, idea). null only when ambiguous (system, organization can be either).
- For non-noun words, all four of these fields are null.

VERBS:
- transitivity: "intransitive" | "transitive" | "ditransitive" | "both" | null
  intransitive: never takes a direct object (sleep, arrive, cry)
  transitive: takes one direct object (want, see, like, hit)
  ditransitive: takes two objects (give, tell, send, bring, show)
  both: flexes between transitive and intransitive (eat, drink, read, write, sing — "I eat" and "I eat food" are both fine)
- verbAspectClass: "stative" | "dynamic" | "both" | null
  stative: refers to a state, not an action; doesn't typically take progressive (-ing) form (know, like, want, need, see, hear, own, belong, contain)
  dynamic: refers to an action or process; takes progressive freely (run, eat, write, build)
  both: usable as either depending on sense (have — "I have a cat" stative vs "I am having dinner" dynamic; think — "I think so" stative vs "I am thinking about it" dynamic)
- commonCollocations: { particles: string[], prepositions: string[] } | null
  Be THOROUGH for both arrays. List every common particle/preposition that competent speakers would recognize, not just the most obvious one. A verb with one common phrasal use almost always has 2–5 more. If you can think of a phrasal verb formed with this verb, list its particle.
  particles: every common particle this verb forms phrasal verbs with — particles change the verb's meaning. Examples (notice the breadth): eat → ["up","out","in","into","away"]; look → ["up","out","over","after","into","through","around"]; turn → ["on","off","down","up","over","around","back"]; give → ["back","up","in","out","away"]; get → ["up","out","in","over","through","around","back","off","on","away"]; come → ["back","up","down","over","along","across","through","around"]; go → ["up","down","out","in","over","through","back","around","along","off","on","away"]. Empty array ONLY if the verb genuinely never forms phrasal verbs.
  prepositions: every preposition this verb commonly takes to introduce a complement, where the preposition is structurally required. Examples: wait → ["for"]; rely → ["on"]; depend → ["on"]; agree → ["with","to","on","about"]; talk → ["to","with","about"]; look → ["at"]; listen → ["to"]; ask → ["for","about"]; think → ["about","of"]; care → ["about","for"]. Empty array if the verb doesn't commonly take a specific preposition.
  Set to { particles: [], prepositions: [] } if the verb takes neither. null only for non-verbs.
- For non-verb words, all three of these fields are null.

ADJECTIVES:
- adjectivePosition: "attributive" | "predicative" | "both" | null
  attributive: only appears before a noun ("former president", "main reason"). Cannot be used after a copula.
  predicative: only appears after a copula ("the cat is asleep", "she is afraid"). Cannot precede a noun.
  both: works in either position (good, big, happy, tired, blue) — most adjectives.
  null for non-adjectives.

ADVERBS:
- adverbType: "time" | "place" | "manner" | "frequency" | "degree" | "other" | null
  time: now, soon, today, yesterday, then
  place: here, there, everywhere, outside
  manner: quickly, carefully, well (most -ly adverbs)
  frequency: always, never, often, sometimes, usually
  degree: very, really, quite, too, extremely
  other: for adverbs that don't fit any of the above (yes, no as adverbs in some uses)
  null for non-adverbs.

NUMERALS:
- numeralType: "cardinal" | "ordinal" | null
  cardinal: counts (one, two, three, ten, hundred)
  ordinal: orders (first, second, third, tenth)
  null for non-numerals.

PRONOUNS:
- person: 1 | 2 | 3 | null
  1 for I/me/my/mine/myself/we/us/our/ours/ourselves
  2 for you/your/yours/yourself/yourselves
  3 for he/him/his/himself, she/her/hers/herself, it/its/itself, they/them/their/theirs/themselves
  null for non-pronouns and pronouns with no fixed person (interrogatives, relative pronouns, indefinite pronouns).
- number: "singular" | "plural" | null
  singular: I/me/my/he/she/it/myself/yourself/himself/herself/itself
  plural: we/us/our/they/them/their/ourselves/yourselves/themselves
  null for "you" (which is both), and for non-pronouns and number-neutral pronouns.
- gender: "masculine" | "feminine" | "neuter" | null
  masculine: he/him/his/himself
  feminine: she/her/hers/herself
  neuter: it/its/itself
  null for everything else (including all 1st and 2nd person pronouns, plural pronouns).

For the umbrella atoms (pronoun, conjunction, determiner): never use as primary grammaticalAtom. They only appear in alternateAtoms. Every pronoun word also gets { atom: "pronoun", when: "umbrella" } in alternateAtoms. Every conjunction word also gets { atom: "conjunction", when: "umbrella" } in alternateAtoms. Every determiner-class word (indefinite_article, definite_article, quantifier_determiner, demonstrative, possessive_determiner) also gets { atom: "determiner", when: "umbrella" } in alternateAtoms.

Determiner subtypes:
  - indefinite_article: ONLY "a" and "an". Primary atom for both.
  - definite_article: ONLY "the". Primary atom.
  - quantifier_determiner: words expressing quantity — some, any, much, many, few, several, all, no, every, each. Primary atom for these.
  - demonstrative: this, that, these, those. (Already its own atom.)
  - possessive_determiner: my, your, his, her, our, their, its. (Already its own atom.)

For "to": primary grammaticalAtom is "preposition". alternateAtoms includes { atom: "infinitive_marker", when: "before a bare infinitive verb, e.g. 'want to go'" }.

Important: personal_pronoun is subject case only (I, you, he, she, we, they); object_pronoun is object case only (me, him, her, us, them). Possessive determiners (my, your, his, her, our, their) sit before a noun. Possessive pronouns (mine, yours, hers, ours, theirs) stand alone.

Reply with only valid JSON. No explanation.`
})()

export function wordEnricherL1() {
  return {
    name: 'word-enricher-l1',
    configureServer(server) {
      server.middlewares.use('/__enrich-word', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return }
        const chunks = []
        req.on('data', chunk => chunks.push(chunk))
        req.on('end', async () => {
          try {
            const { baseForm, lang } = JSON.parse(Buffer.concat(chunks).toString('utf-8'))
            const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
            const message = await client.messages.create({
              model: 'claude-haiku-4-5-20251001',
              max_tokens: 120,
              system: [{ type: 'text', text: L1_SYSTEM, cache_control: { type: 'ephemeral' } }],
              messages: [{ role: 'user', content: `Classify this word: "${baseForm}" (${lang === 'en' ? 'English' : lang})` }],
            })
            const raw = (message.content[0]?.text?.trim() ?? '{}')
              .replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/, '')
            const data = JSON.parse(raw)
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(data))
          } catch (err) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: err.message }))
          }
        })
      })
    },
  }
}

export function wordEnricherL2() {
  return {
    name: 'word-enricher-l2',
    configureServer(server) {
      server.middlewares.use('/__enrich-word-l2', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return }
        const chunks = []
        req.on('data', chunk => chunks.push(chunk))
        req.on('end', async () => {
          try {
            const { baseForm, lang, layer1 } = JSON.parse(Buffer.concat(chunks).toString('utf-8'))
            const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
            const message = await client.messages.create({
              model: 'claude-haiku-4-5-20251001',
              max_tokens: 2000,
              system: [{ type: 'text', text: L2_SYSTEM, cache_control: { type: 'ephemeral' } }],
              messages: [{ role: 'user', content: `Word: "${baseForm}" (${lang === 'en' ? 'English' : lang})\nLayer 1 data: ${JSON.stringify(layer1)}` }],
            })
            const raw = (message.content[0]?.text?.trim() ?? '{}')
              .replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/, '')
            const data = JSON.parse(raw)
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(data))
          } catch (err) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: err.message }))
          }
        })
      })
    },
  }
}
