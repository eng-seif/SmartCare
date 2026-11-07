// Run with the web package's tsx after generating the synthetic fixture.
// No customer recording or profile is used.
import { readFile } from 'node:fs/promises'
import { voiceChunks } from '../artifacts/fathalla-health/src/lib/voice-policy'
import { transcribeChunks } from '../artifacts/fathalla-health/src/lib/voice-transcription'

const fixture = await readFile(new URL('../generated-artifacts/voice-test.wav', import.meta.url))
const text = await transcribeChunks(voiceChunks(fixture), 'en', AbortSignal.timeout(35000))
const passed = /fi[bv](?:er|re)/i.test(text) && /protein/i.test(text)
console.log(JSON.stringify({ syntheticSpeechVerified: passed, transcript: text }))
if (!passed) process.exitCode = 1
