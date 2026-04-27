import Anthropic from '@anthropic-ai/sdk'

export default function samplePortraitGenerator() {
  return {
    name: 'sample-portrait-generator',
    configureServer(server) {
      server.middlewares.use('/__generate-sample-portrait', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return }
        const chunks = []
        req.on('data', chunk => chunks.push(chunk))
        req.on('end', async () => {
          try {
            const prompt = `Invent a person. Not a character — a real-feeling human being with a specific life. Write a 2-3 sentence portrait of who they are: what matters to them, how they move through the world, what their days feel like. Specific and grounded. No mention of language learning.`
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
