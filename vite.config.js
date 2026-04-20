import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { config as dotenvConfig } from 'dotenv'
import Anthropic from '@anthropic-ai/sdk'

dotenvConfig()
import { ATOMS } from './src/grammarAtoms.en.js'
import { STRUCTURES } from './src/sentenceStructures.en.js'

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
            const { eligibleStructures, wordBankWords, minWords = 3, maxWords = 5 } =
              JSON.parse(Buffer.concat(chunks).toString('utf-8'))

            const structureList = eligibleStructures
              .map(s => `- ${s.label} (e.g. "${s.example}")`)
              .join('\n')

            const wordList = wordBankWords.join(', ')

            const prompt = `You are generating a reading practice sentence for an English language learner at A1 level.

The learner's vocabulary words are: ${wordList}

Valid sentence structures for this learner (choose one naturally):
${structureList}

Rules:
- Use only the learner's vocabulary words for content words (nouns, main verbs, adjectives, adverbs)
- Grammatical function words (I, you, he, she, it, we, they, a, an, the, am, is, are, do, does, not, and their contracted forms) may be used freely as needed
- The sentence must be between ${minWords} and ${maxWords} words
- Generate exactly one natural, correct English sentence — no explanation, no punctuation commentary, nothing else
- Vary structure — do not always use the simplest pattern if richer ones are available

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

            const prompt = `You are classifying a word for a language learning app.

Word: "${baseForm}" (${lang === 'en' ? 'English' : lang})

Return a JSON object with these fields:
- grammaticalCategory: one of: noun, verb, adjective, adverb, pronoun, determiner, conjunction, preposition, interrogative, demonstrative, negation, interjection
- meaning: a short definition (5–10 words) suitable for a language learner
- semanticSubtype: a finer label within the category (e.g. noun → person/place/thing/abstract; verb → action/state/motion; adjective → size/quality/emotion/temperature/age; adverb → time/place/manner/frequency)

Reply with only valid JSON. No explanation.`

            const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
            const message = await client.messages.create({
              model: 'claude-haiku-4-5-20251001',
              max_tokens: 120,
              messages: [{ role: 'user', content: prompt }],
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

// Dev-only plugin: accepts POST /__enrich-word-l2 and calls the Claude API.
// Returns Layer 2 data: { grammaticalAtom, cefrLevel, subLevel, structuresEnabled,
//                         frequency, collocations, contentReady }
function wordEnricherL2() {
  const atomList = ATOMS
    .map(a => `- ${a.id}: ${a.description} (e.g. ${a.examples.slice(0, 3).join(', ')})`)
    .join('\n')

  const structureList = STRUCTURES
    .map(s => `- ${s.id} (${s.label}, ${s.subLevel}): needs ${s.requiredBlocks.join(' + ')}`)
    .join('\n')

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

            const prompt = `You are building a detailed linguistic profile for a word in a language learning app.

Word: "${baseForm}" (${lang === 'en' ? 'English' : lang})
Layer 1 data: ${JSON.stringify(layer1)}

Grammar atoms — pick the single best one for grammaticalAtom:
${atomList}

Sentence structures — list IDs in structuresEnabled that this word helps unlock or can fill a slot in:
${structureList}

Return a JSON object with these fields:
- grammaticalAtom: one atom ID from the list above
- cefrLevel: earliest CEFR level where this word is useful (e.g. "A1")
- subLevel: earliest sub-level (e.g. "A1.1", "A1.2", "A1.3")
- structuresEnabled: array of structure IDs this word helps unlock or can fill a slot in
- frequency: "core" | "high" | "medium" | "low" (relative to its CEFR level)
- contentReady: false

Reply with only valid JSON. No explanation.`

            const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
            const message = await client.messages.create({
              model: 'claude-haiku-4-5-20251001',
              max_tokens: 200,
              messages: [{ role: 'user', content: prompt }],
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

export default defineConfig({
  plugins: [
    react(),
    celestialDesignWriter(),
    phase1SequenceWriter(),
    sentenceGenerator(),
    wordEnricherL1(),
    wordEnricherL2(),
  ],
})
