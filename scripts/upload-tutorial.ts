import { readFile } from 'node:fs/promises'
import { tutorialFile } from '../artifacts/fathalla-health/src/lib/tutorial-storage'
const file = tutorialFile()
await file.save(await readFile(new URL('../generated-artifacts/tutorial-recording/fathalla-tutorial.mp4', import.meta.url)), {
  resumable: false,
  metadata: { contentType: 'video/mp4', cacheControl: 'public, max-age=3600' },
})
const [meta] = await file.getMetadata()
console.log(`Tutorial uploaded and verified (${meta.size} bytes).`)
