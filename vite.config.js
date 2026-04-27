import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { config as dotenvConfig } from 'dotenv'

import celestialDesignWriter    from './vite-plugins/celestialDesignWriter.js'
import phase1SequenceWriter     from './vite-plugins/phase1SequenceWriter.js'
import sentenceGenerator        from './vite-plugins/sentenceGenerator.js'
import { wordEnricherL1, wordEnricherL2 } from './vite-plugins/wordEnricher.js'
import seedWordAdder            from './vite-plugins/seedWordAdder.js'
import layerTestGenerator       from './vite-plugins/layerTestGenerator.js'
import constructorGenerator     from './vite-plugins/constructorGenerator.js'
import writingPromptGeneratorV2 from './vite-plugins/writingPromptGeneratorV2.js'
import samplePortraitGenerator  from './vite-plugins/samplePortraitGenerator.js'

dotenvConfig()

export default defineConfig({
  plugins: [
    react(),
    celestialDesignWriter(),
    phase1SequenceWriter(),
    sentenceGenerator(),
    wordEnricherL1(),
    wordEnricherL2(),
    seedWordAdder(),
    layerTestGenerator(),
    samplePortraitGenerator(),
    constructorGenerator(),
    writingPromptGeneratorV2(),
  ],
})
