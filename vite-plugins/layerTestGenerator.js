import Anthropic from '@anthropic-ai/sdk'
import { buildAISystemPrompt } from '../src/aiIdentity.js'
import { buildLevelChannel, buildDirective } from '../src/systemVocabulary.js'

// mode 'l1'        — AI identity only, free expression
// mode 'l1l2'      — identity + learner introduction
// mode 'l1l2l3'    — + CEFR level channel
// mode 'l1l2l3l4'  — + world folder (specific inventory)
// Returns { sentence, promptSent }
export default function layerTestGenerator() {
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
              userMessage = `${learnerBlock}\n\n${buildLevelChannel(cefrLevel)}\n\n${directive}`
            } else if (mode === 'l1l2l3l4') {
              const tierSection = tierBlock
                ? `\n\nFor this response, aim for this structure specifically:\n${tierBlock}`
                : ''
              userMessage = `${learnerBlock}\n\n${buildLevelChannel(cefrLevel)}\n\n${promptBlock}${tierSection}\n\n${directive}`
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
