import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { config as dotenvConfig } from 'dotenv'
import Anthropic from '@anthropic-ai/sdk'

dotenvConfig()
import { ATOMS } from './src/grammarAtoms.en.js'
import { buildAISystemPrompt } from './src/aiIdentity.js'
import { buildLevelChannel, buildDirective } from './src/systemVocabulary.js'

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
            const { frame, minWords = 3, maxWords = 5, recentSentences = [], allowedWords = [] } =
              JSON.parse(Buffer.concat(chunks).toString('utf-8'))

            const frameLines = Object.entries(frame)
              .map(([slot, word]) => `  ${slot}: ${word}`)
              .join('\n')

            const vocabBlock = allowedWords.length > 0
              ? `\nVOCABULARY CONSTRAINT: You may only use words from this list (plus their inflected forms). Do not introduce any other words:\n${allowedWords.join(', ')}`
              : ''

            const avoidBlock = recentSentences.length > 0
              ? `\nAvoid repeating these:\n${recentSentences.map(s => `- "${s}"`).join('\n')}`
              : ''

            const prompt = `Write one natural English sentence using these words in these slot positions. Apply correct English grammar — including subject-verb agreement (he/she/it → verb+s), correct pronoun case, and any other required inflection.

Slots:
${frameLines}
${vocabBlock}
${avoidBlock}
Length: ${minWords}–${maxWords} words. Reply with only the sentence, nothing else.`

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

// Dev-only plugin: accepts POST /__generate-mirror and returns a generated sentence.
// Input:  { tier: { label, examples }, promptBlock, lang }
//   promptBlock — the inventory snapshot constraint envelope (AVAILABLE or RESTRICTED block)
//   tier        — the constructor tier that defines the sentence structure
// Output: { sentence }
function mirrorGenerator() {
  return {
    name: 'mirror-generator',
    configureServer(server) {
      server.middlewares.use('/__generate-mirror', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return }
        const chunks = []
        req.on('data', chunk => chunks.push(chunk))
        req.on('end', async () => {
          try {
            const { tier, promptBlock, lang } =
              JSON.parse(Buffer.concat(chunks).toString('utf-8'))

            const prompt = `Generate one sentence for a ${lang} learner. You must respect both constraints below exactly.

VOCABULARY CONSTRAINT — only words listed here (and their inflected forms) may appear:
${promptBlock}

SENTENCE STRUCTURE: ${tier.label}
Examples of this structure: ${tier.examples.join(' / ')}

Generate ONE sentence that fits the structure and uses only vocabulary from the constraint above.
Apply correct grammatical agreement (e.g. he/she/it → verb+s).
Return only the sentence, nothing else.`

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

// Dev-only plugin: accepts POST /__generate-layer-test and tests the three-layer AI architecture.
// mode 'l1'      — Layer 1 only: AI identity, no inventory, free expression
// mode 'l1l2'    — Layer 1 + 2: AI identity + learner introduction, no tier constraint
// mode 'l1l2l3'  — Full stack: all three layers
// Returns { sentence, promptSent } so the Mirror can show what was sent.
function layerTestGenerator() {
  return {
    name: 'layer-test-generator',
    configureServer(server) {
      server.middlewares.use('/__generate-layer-test', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return }
        const chunks = []
        req.on('data', chunk => chunks.push(chunk))
        req.on('end', async () => {
          try {
            const { mode, lang, learnerBlock, tierBlock, cefrLevel = 'A1', currentCluster = null, promptBlock, scope = 'sentence', rawUserMessage = null, directiveOverride = null } =
              JSON.parse(Buffer.concat(chunks).toString('utf-8'))
            const directive = directiveOverride ?? buildDirective('layer-test', { scope })

            const systemPrompt = buildAISystemPrompt(lang)
            const scopeInstruction = scope === 'paragraph'
              ? 'Up to a paragraph (3–5 sentences). Let the thought breathe.'
              : 'One sentence only.'

            let userMessage
            if (rawUserMessage) {
              userMessage = rawUserMessage
            } else if (mode === 'l1') {
              userMessage = `Say something. Express whatever feels genuine and worth saying. One short paragraph.`
            } else if (mode === 'l1l2') {
              userMessage = `${learnerBlock}\n\nSay something to this person, from inside their world. Express something genuine — an observation, a feeling, a desire. One short paragraph.`
            } else if (mode === 'l1l2l3') {
              userMessage = `${learnerBlock}\n\n${buildLevelChannel(cefrLevel, currentCluster)}\n\n${directive}`
            } else if (mode === 'l1l2l3l4') {
              const tierSection = tierBlock
                ? `\n\nFor this response, aim for this structure specifically:\n${tierBlock}`
                : ''
              userMessage = `${learnerBlock}\n\n${buildLevelChannel(cefrLevel, currentCluster)}\n\n${promptBlock}${tierSection}\n\n${directive}`
            } else {
              const tierSection = tierBlock
                ? `\n\nUse this sentence structure specifically — no looser, no more complex:\n${tierBlock}`
                : ''
              userMessage = `${learnerBlock}${tierSection}\n\nSpeak from inside this world, within this grammatical range. ${scopeInstruction}`
            }

            const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
            const message = await client.messages.create({
              model:      'claude-haiku-4-5-20251001',
              max_tokens: (mode === 'l1' || mode === 'l1l2') ? 150 : 300,
              system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
              messages: [{ role: 'user', content: userMessage }],
            })

            const sentence = message.content[0]?.text?.trim() ?? ''
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ sentence, promptSent: userMessage }))
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

            const prompt = `Generate one A1-level English sentence using ONLY the words specified below — no other words allowed. Inflect for grammatical agreement (e.g. he/she/it → verb+s) but do not add any words beyond what is listed.

Target slot (must appear, inflected as needed):
  ${targetSlotId}: "${targetWord}"
${filledOthers.length > 0 ? `
Other filled slots (use exactly these words, inflected as needed):
${filledOthers.map(([slot, word]) => `  ${slot}: "${word}"`).join('\n')}` : ''}
${unfilledSlotWords.length > 0 ? `
Remaining slots — pick one word from each list, no others:
${unfilledSlotWords.map(([slot, words]) => `  ${slot}: ${words.join(', ')}`).join('\n')}` : ''}
STRICT: the sentence must contain only words from the slots above. Return only the sentence.`

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

// Dev-only plugin: accepts POST /__generate-writing-prompt and calls the Claude API.
// Input:  { selectedTopic, grammarWords, scope, lang, cefrLevel }
//   selectedTopic — { topic, words } — the one topic the learner will write about
//   grammarWords  — words from active atom classes (structural/function words)
//   scope         — { sentences, structure } from CLUSTER_SCOPE
// Output: { prompt }
function writingPromptGenerator() {
  return {
    name: 'writing-prompt-generator',
    configureServer(server) {
      server.middlewares.use('/__generate-writing-prompt', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return }

        const chunks = []
        req.on('data', chunk => chunks.push(chunk))
        req.on('end', async () => {
          try {
            const { selectedTopic, grammarWords, scope, lang, cefrLevel, forceInstruction } =
              JSON.parse(Buffer.concat(chunks).toString('utf-8'))

            const forceBlock = forceInstruction
              ? `\nFORCED STRUCTURE (the learner's response MUST use this): ${forceInstruction}`
              : ''

            const prompt = `You are generating a writing prompt for a ${lang} learner at CEFR level ${cefrLevel ?? 'A1'}.

TOPIC: ${selectedTopic.topic}
Topic vocabulary (the only content words available to the learner): ${selectedTopic.words.join(', ')}

Grammar/function words available to the learner: ${grammarWords.length > 0 ? grammarWords.join(', ') : '(none)'}

The learner will respond in ${scope.sentences} using these structures: ${scope.structure}.${forceBlock}

Write ONE short prompt — a single question or scenario — that:
- The prompt itself is one sentence only
- Concerns only the "${selectedTopic.topic}" topic
- Can be answered using ONLY the vocabulary listed above
- Invites a response of ${scope.sentences}${forceInstruction ? `\n- The scenario must make it natural to use: ${forceInstruction}` : ''}
- Feels personally meaningful, not like a language exercise

Reply with only the prompt sentence. No explanation.`

            const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
            const message = await client.messages.create({
              model: 'claude-haiku-4-5-20251001',
              max_tokens: 80,
              messages: [{ role: 'user', content: prompt }],
            })

            const result = message.content[0]?.text?.trim() ?? ''
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ prompt: result }))
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

// Dev-only plugin: accepts POST /__generate-writing-prompt-v2
// Uses the five-slot model: targetAtom, activeAtoms, vocabContext, scope, difficulty, forceInstruction, portrait
// Output: { prompt }
function writingPromptGeneratorV2() {
  return {
    name: 'writing-prompt-generator-v2',
    configureServer(server) {
      server.middlewares.use('/__generate-writing-prompt-v2', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return }
        const chunks = []
        req.on('data', chunk => chunks.push(chunk))
        req.on('end', async () => {
          try {
            const { targetAtom, activeAtoms = [], vocabContext, scope, difficulty = 1, forceInstruction, lang, cefrLevel } =
              JSON.parse(Buffer.concat(chunks).toString('utf-8'))

            const grammarBlock = activeAtoms.length > 0
              ? activeAtoms.map(a => `  ${a.label ?? a.id}: ${(a.words ?? []).join(', ') || 'none'}`).join('\n')
              : '  (none)'

            const difficultyNote = {
              1: 'The prompt should be highly scaffolded — almost fill-in-the-blank.',
              2: 'The prompt should provide a sentence starter or partial structure.',
              3: 'The prompt should give a topic only — no structural scaffolding.',
              4: 'The prompt should feel natural. Do not hint at the required structure.',
            }[difficulty] ?? ''

            const forceBlock = forceInstruction
              ? `\nREQUIRED STRUCTURE: ${forceInstruction}`
              : ''

            const prompt = `LEARNER: ${cefrLevel ?? 'A1'} ${lang ?? 'English'} — expect short sentences, basic structures, high-frequency words only.

PRIMARY GRAMMAR TARGET: ${targetAtom?.label ?? targetAtom?.id ?? '(unknown)'}
Available words for this structure: ${(targetAtom?.words ?? []).join(', ') || '(none)'}

OTHER ACTIVE GRAMMAR:
${grammarBlock}

TOPIC CONTEXT: ${vocabContext?.topic ?? '(none)'}
Topic vocabulary: ${(vocabContext?.words ?? []).join(', ') || '(none)'}

SCOPE: ${scope?.sentences ?? '1 sentence'} · ${scope?.structure ?? 'Subject + Verb'}${forceBlock}

DIFFICULTY ${difficulty}/4: ${difficultyNote}

Write ONE prompt — a question or scenario — that:
- Uses only the vocabulary listed above
- Targets the primary grammar structure
- Can be answered in ${scope?.sentences ?? '1 sentence'}
- Feels personally meaningful, not like a language exercise
- Is one sentence only

Reply with only the prompt. No explanation.`

            const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
            const message = await client.messages.create({
              model: 'claude-haiku-4-5-20251001',
              max_tokens: 100,
              messages: [{ role: 'user', content: prompt }],
            })

            const result = message.content[0]?.text?.trim() ?? ''
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ prompt: result }))
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

function samplePortraitGenerator() {
  return {
    name: 'sample-portrait-generator',
    configureServer(server) {
      server.middlewares.use('/__generate-sample-portrait', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return }
        const chunks = []
        req.on('data', chunk => chunks.push(chunk))
        req.on('end', async () => {
          try {
            const { wordBank, lang } = JSON.parse(Buffer.concat(chunks).toString('utf-8'))
            const prompt = `Someone is building a world in ${lang}. These are the words they have chosen to carry so far:\n\n${wordBank.join(', ')}\n\nBased only on what they've chosen, write a brief portrait of who this person might be — not as a language learner, but as a human being. What seems to matter to them? What kind of person do they appear to be? 2-3 sentences, specific and grounded. No generic observations.`
            const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
            const message = await client.messages.create({
              model: 'claude-haiku-4-5-20251001',
              max_tokens: 150,
              messages: [{ role: 'user', content: prompt }],
            })
            const portrait = message.content[0]?.text?.trim() ?? ''
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ portrait }))
          } catch (err) {
            res.statusCode = 500
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
    mirrorGenerator(),
    layerTestGenerator(),
    samplePortraitGenerator(),
    constructorGenerator(),
    writingPromptGenerator(),
    writingPromptGeneratorV2(),
  ],
})
