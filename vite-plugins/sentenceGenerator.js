import Anthropic from '@anthropic-ai/sdk'

export default function sentenceGenerator() {
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
