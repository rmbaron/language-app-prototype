import Anthropic from '@anthropic-ai/sdk'

export default function constructorGenerator() {
  return {
    name: 'constructor-generator',
    configureServer(server) {
      server.middlewares.use('/__generate-constructor', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return }
        const chunks = []
        req.on('data', chunk => chunks.push(chunk))
        req.on('end', async () => {
          try {
            const { targetSlotId, targetWord, filledSlots = {}, slotWords, lang } =
              JSON.parse(Buffer.concat(chunks).toString('utf-8'))

            const filledOthers = Object.entries(filledSlots).filter(([slot]) => slot !== targetSlotId)
            const unfilledSlotWords = Object.entries(slotWords)
              .filter(([slot]) => slot !== targetSlotId && !filledSlots[slot])

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
