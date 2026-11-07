import { test } from 'node:test'
import assert from 'node:assert/strict'
import { wavSeconds, voiceChunks, joinVoiceText, voiceBudget } from '../src/lib/voice-policy'
function wav(seconds = 1) {
  const bytes = Buffer.alloc(44 + seconds * 32000)
  bytes.write('RIFF'); bytes.writeUInt32LE(bytes.length - 8, 4); bytes.write('WAVE', 8)
  bytes.write('fmt ', 12); bytes.writeUInt32LE(16, 16); bytes.writeUInt16LE(1, 20)
  bytes.writeUInt16LE(1, 22); bytes.writeUInt32LE(16000, 24); bytes.writeUInt32LE(32000, 28)
  bytes.writeUInt16LE(2, 32); bytes.writeUInt16LE(16, 34); bytes.write('data', 36)
  bytes.writeUInt32LE(seconds * 32000, 40)
  return bytes
}
test('Only bounded PCM mono 16 kHz voice can reach the paid transcription provider', () => {
  assert.equal(wavSeconds(wav()), 1)
  assert.equal(wavSeconds(wav(30)), 30)
  assert.equal(wavSeconds(wav(32)), null)
  assert.equal(wavSeconds(wav(0)), null)
  assert.equal(wavSeconds(Buffer.from('not audio')), null)
  const stereo = wav(); stereo.writeUInt16LE(2, 22)
  assert.equal(wavSeconds(stereo), null)
  const compressed = wav(); compressed.writeUInt16LE(3, 20)
  assert.equal(wavSeconds(compressed), null)
  const corrupt = wav(); corrupt.writeUInt32LE(0xffffffff, 40)
  assert.equal(wavSeconds(corrupt), null)
  assert.equal(wavSeconds(wav().subarray(0, 100)), null)
})
test('Long recordings are bounded inline chunks with valid WAV headers and overlap', () => {
  const chunks = voiceChunks(wav(30))
  assert.equal(chunks.length, 2)
  assert.equal(wavSeconds(chunks[0]), 15)
  assert.equal(wavSeconds(chunks[1]), 15.5)
  assert.ok(chunks.every(c => c.length < 8 * 1024 * 1024))
  assert.equal(voiceChunks(wav(1)).length, 1)
  assert.throws(() => voiceChunks(Buffer.from('not WAV')))
  assert.equal(voiceBudget(2), 40960)
})
test('Chunk merging removes overlapping words while preserving Arabic and English', () => {
  assert.equal(joinVoiceText(['إيه فايدة البروتين والألياف', 'البروتين والألياف في الأكل؟']), 'إيه فايدة البروتين والألياف في الأكل؟')
  assert.equal(joinVoiceText(['What is dietary fibre?', 'dietary fibre and protein?']), 'What is dietary fibre? and protein?')
  assert.equal(joinVoiceText(['', '']), '')
})
