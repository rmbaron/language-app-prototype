import Anthropic from '@anthropic-ai/sdk'

export default function writingPromptGeneratorV2() {
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

            const forceBlock = forceInstruction ? `\nREQUIRED STRUCTURE: ${forceInstruction}` : ''

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
