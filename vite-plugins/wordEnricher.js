import Anthropic from '@anthropic-ai/sdk'
import { ATOMS } from '../src/grammarAtoms.en.js'

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
  return `You are building detailed linguistic profiles for words in a language learning app.

Grammar atoms — pick the single best one for grammaticalAtom:
${atomList}

Return a JSON object with these fields:
- grammaticalAtom: one atom ID from the list above — the primary grammatical classification
- alternateAtoms: array of { atom, when } objects for any secondary grammatical functions this word can serve. "atom" is an atom ID from the list above. "when" is a short phrase describing the context in which this alternate function applies (e.g. "introducing a dependent clause", "used as progressive auxiliary", "used as perfect auxiliary"). Empty array if the word has only one grammatical function.
- cefrLevel: earliest CEFR level where this word is useful (e.g. "A1")
- subLevel: earliest sub-level (e.g. "A1.1", "A1.2", "A1.3")
- frequency: "core" | "high" | "medium" | "low" (relative to its CEFR level)
- forms: array of { form, type } objects for all inflected forms (e.g. third_person_present, past, present_participle, future, plural, comparative, superlative, object, possessive, reflexive, vowel_variant, contracted_negative, contracted_negative_third, subject_contraction). For auxiliary, modal, and copula verbs always include contracted negative forms (e.g. don't, doesn't, can't, won't, isn't, aren't) and subject contractions where natural (e.g. I'm, you're, he's for "be"). Empty array if the word does not inflect.
- contentReady: false

Important: for pronouns, distinguish carefully — personal_pronoun is subject case only (I, you, he, she, we, they); object_pronoun is object case only (me, him, her, us, them). Do not classify object-case pronouns as personal_pronoun.

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
              max_tokens: 800,
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
