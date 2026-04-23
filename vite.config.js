import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { config as dotenvConfig } from 'dotenv'
import Anthropic from '@anthropic-ai/sdk'

dotenvConfig()
import { ATOMS } from './src/grammarAtoms.en.js'

// Dev-only plugin: accepts POST /__celestial-design and writes src/celestialDesign.js.
// This endpoint only exists during `vite dev` — it is never included in builds.
function celestialDesignWriter() {
  return {
    name: 'celestial-design-writer',
    configureServer(server) {
      server.middlewares.use('/__celestial-design', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end()
          return
        }
        const chunks = []
        req.on('data', chunk => chunks.push(chunk))
        req.on('end', () => {
          try {
            const design = JSON.parse(Buffer.concat(chunks).toString('utf-8'))
            const filePath = path.join(process.cwd(), 'src', 'celestialDesign.js')
            const content = [
              '// Celestial Design Config — managed by the Celestial Editor.',
              '// Open the editor with the E key while on the Celestial screen.',
              `export default ${JSON.stringify(design, null, 2)}`,
              '',
            ].join('\n')
            fs.writeFileSync(filePath, content, 'utf-8')
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true }))
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

// Dev-only plugin: accepts POST /__phase1-sequence and writes src/phase1Sequence.en.js.
function phase1SequenceWriter() {
  return {
    name: 'phase1-sequence-writer',
    configureServer(server) {
      server.middlewares.use('/__phase1-sequence', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end()
          return
        }
        const chunks = []
        req.on('data', chunk => chunks.push(chunk))
        req.on('end', () => {
          try {
            const sequence = JSON.parse(Buffer.concat(chunks).toString('utf-8'))
            const filePath = path.join(process.cwd(), 'src', 'phase1Sequence.en.js')
            const content = [
              '// Phase 1 word sequence — English target language.',
              '// Managed by the Celestial Editor. Manual edits are safe.',
              '// Field reference: wordId, laneOrder, functionUnlocked, sentences, grammarSlots.',
              '',
              `export const PHASE1_SEQUENCE = ${JSON.stringify(sequence, null, 2)}`,
              '',
            ].join('\n')
            fs.writeFileSync(filePath, content, 'utf-8')
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true }))
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

// Dev-only plugin: accepts POST /__generate-sentence and calls the Claude API.
// The API key lives in .env (ANTHROPIC_API_KEY) — never exposed to the browser.
// Input:  { eligibleStructures, wordBankWords, minWords, maxWords }
// Output: { sentence }
function sentenceGenerator() {
  return {
    name: 'sentence-generator',
    configureServer(server) {
      server.middlewares.use('/__generate-sentence', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return }

        const chunks = []
        req.on('data', chunk => chunks.push(chunk))
        req.on('end', async () => {
          try {
            const { eligibleStructures, wordBankWords, minWords = 3, maxWords = 5, recentSentences = [] } =
              JSON.parse(Buffer.concat(chunks).toString('utf-8'))

            const structureList = eligibleStructures
              .map(s => `- ${s.label} (e.g. "${s.example}")`)
              .join('\n')

            const wordList = wordBankWords.join(', ')

            const avoidBlock = recentSentences.length > 0
              ? `\nRecently generated (do not repeat these or use the same structure back-to-back):\n${recentSentences.map(s => `- "${s}"`).join('\n')}\n`
              : ''

            const prompt = `You are generating a reading practice sentence for an English language learner at A1 level.

The learner's vocabulary words are: ${wordList}

Valid sentence structures (pick one — rotate through different ones, do not default to the simplest):
${structureList}
${avoidBlock}
Rules:
- Use only the learner's vocabulary words for content words (nouns, main verbs, adjectives, adverbs)
- Grammatical function words (I, you, he, she, it, we, they, a, an, the, am, is, are, do, does, not, and their contracted forms) may be used freely as needed
- The sentence must be between ${minWords} and ${maxWords} words
- Generate exactly one natural, correct English sentence — no explanation, no punctuation commentary, nothing else
- Use a different structure and different words than the recent sentences above

Reply with only the sentence.`

            const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
            const message = await client.messages.create({
              model: 'claude-haiku-4-5-20251001',
              max_tokens: 60,
              messages: [{ role: 'user', content: prompt }],
            })

            const sentence = message.content[0]?.text?.trim() ?? ''
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ sentence }))
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

const L1_SYSTEM = `You are classifying words for a language learning app.

Return a JSON object with these fields:
- grammaticalCategory: one of: noun, verb, adjective, adverb, pronoun, determiner, conjunction, preposition, interrogative, demonstrative, negation, interjection, numeral
- meaning: a short definition (5–10 words) suitable for a language learner
- semanticSubtype: a finer label within the category (e.g. noun → person/place/thing/abstract; verb → action/state/motion; adjective → size/quality/emotion/temperature/age; adverb → time/place/manner/frequency)

Reply with only valid JSON. No explanation.`

// Dev-only plugin: accepts POST /__enrich-word and calls the Claude API.
// Returns Layer 1 data: { grammaticalCategory, meaning, semanticSubtype }
function wordEnricherL1() {
  return {
    name: 'word-enricher-l1',
    configureServer(server) {
      server.middlewares.use('/__enrich-word', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return }

        const chunks = []
        req.on('data', chunk => chunks.push(chunk))
        req.on('end', async () => {
          try {
            const { wordId, baseForm, lang } =
              JSON.parse(Buffer.concat(chunks).toString('utf-8'))

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

// Dev-only plugin: accepts POST /__enrich-word-l2 and calls the Claude API.
// Returns Layer 2 data: { grammaticalAtom, alternateAtoms, cefrLevel, subLevel, frequency, forms, contentReady }
function wordEnricherL2() {
  return {
    name: 'word-enricher-l2',
    configureServer(server) {
      server.middlewares.use('/__enrich-word-l2', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return }

        const chunks = []
        req.on('data', chunk => chunks.push(chunk))
        req.on('end', async () => {
          try {
            const { wordId, baseForm, lang, layer1 } =
              JSON.parse(Buffer.concat(chunks).toString('utf-8'))

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

// Dev-only plugin: accepts POST /__add-seed-word and appends to wordSeed.en.js.
// Input:  { baseForm, language }
// Output: { ok, id } or { error }
function seedWordAdder() {
  return {
    name: 'seed-word-adder',
    configureServer(server) {
      server.middlewares.use('/__add-seed-word', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return }
        const chunks = []
        req.on('data', chunk => chunks.push(chunk))
        req.on('end', () => {
          try {
            const { baseForm, language = 'en' } = JSON.parse(Buffer.concat(chunks).toString('utf-8'))
            const id = baseForm.trim().toLowerCase().replace(/\s+/g, '_')
            const filePath = path.join(process.cwd(), 'src', 'wordSeed.en.js')
            let content = fs.readFileSync(filePath, 'utf-8')

            // Reject duplicates
            if (content.includes(`id: '${id}'`)) {
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: `'${id}' already exists in seed` }))
              return
            }

            const entry = `  { id: '${id}', baseForm: '${baseForm.trim()}', language: '${language}' },\n`
            content = content.trimEnd().replace(/\]$/, '') + entry + ']\n'
            fs.writeFileSync(filePath, content, 'utf-8')
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true, id }))
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

// Dev-only plugin: accepts POST /__generate-constructor and returns a generated sentence.
// Input:  { targetSlotId, targetWord, targetSlotRole, filledSlots, slotWords, lang }
//   targetWord  — the exact word the learner placed in the target slot
//   filledSlots — { slotId: wordId } all slots the learner has filled (including target)
//   slotWords   — { slotId: [baseForm, ...] } eligible words per slot from the word bank
// Output: { sentence }
function constructorGenerator() {
  return {
    name: 'constructor-generator',
    configureServer(server) {
      server.middlewares.use('/__generate-constructor', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return }
        const chunks = []
        req.on('data', chunk => chunks.push(chunk))
        req.on('end', async () => {
          try {
            const { targetSlotId, targetWord, targetSlotRole, filledSlots = {}, slotWords, lang } =
              JSON.parse(Buffer.concat(chunks).toString('utf-8'))

            const filledOthers = Object.entries(filledSlots)
              .filter(([slot]) => slot !== targetSlotId)

            const filledBlock = filledOthers.length > 0
              ? `The learner has also filled these slots — use exactly these words:\n${filledOthers.map(([slot, word]) => `  ${slot}: "${word}"`).join('\n')}\n`
              : ''

            const unfilledSlotWords = Object.entries(slotWords)
              .filter(([slot]) => slot !== targetSlotId && !filledSlots[slot])

            const optionsBlock = unfilledSlotWords.length > 0
              ? `For unfilled slots, choose from these options only:\n${unfilledSlotWords.map(([slot, words]) => `  ${slot}: ${words.join(', ')}`).join('\n')}\n`
              : ''

            const prompt = `Generate one A1-level English sentence.

Target (the concept being tested — must appear, inflected as needed):
"${targetWord}" in the ${targetSlotId} position — ${targetSlotRole}
${filledOthers.length > 0 ? `
Also use these words, inflected as needed for grammatical agreement:
${filledOthers.map(([slot, word]) => `  ${slot}: "${word}"`).join('\n')}` : ''}
${unfilledSlotWords.length > 0 ? `
For any remaining slots, use only words from this list — no invented words:
${unfilledSlotWords.map(([slot, words]) => `  ${slot}: ${words.join(', ')}`).join('\n')}` : ''}
If a constraint genuinely conflicts with grammar, honor the target slot above all else.
Return only the sentence.`

            const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
            const message = await client.messages.create({
              model: 'claude-haiku-4-5-20251001',
              max_tokens: 60,
              messages: [{ role: 'user', content: prompt }],
            })

            const sentence = message.content[0]?.text?.trim() ?? ''
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ sentence }))
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

export default defineConfig({
  plugins: [
    react(),
    celestialDesignWriter(),
    phase1SequenceWriter(),
    sentenceGenerator(),
    wordEnricherL1(),
    wordEnricherL2(),
    seedWordAdder(),
    constructorGenerator(),
  ],
})
