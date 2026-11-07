export const MAX_VOICE_BYTES = 1_050_000
export const VOICE_ATTEMPTS = 2
export const VOICE_OUTPUT_TOKENS = 8192

export function pcmWav(pcm: Uint8Array): Buffer {
  const b = Buffer.alloc(44 + pcm.length)
  b.write('RIFF'); b.writeUInt32LE(b.length - 8, 4); b.write('WAVE', 8)
  b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20)
  b.writeUInt16LE(1, 22); b.writeUInt32LE(16000, 24); b.writeUInt32LE(32000, 28)
  b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36)
  b.writeUInt32LE(pcm.length, 40); b.set(pcm, 44)
  return b
}

/** Fifteen-second inline chunks, with half a second of overlap for cut words. */
export function voiceChunks(bytes: Uint8Array): Buffer[] {
  if (wavSeconds(bytes) === null) throw new Error('invalid-wav')
  const b = Buffer.from(bytes), data: Buffer[] = []
  for (let at = 12; at + 8 <= b.length;) {
    const size = b.readUInt32LE(at + 4), start = at + 8
    if (b.toString('ascii', at, at + 4) === 'data') data.push(b.subarray(start, start + size))
    at = start + size + (size % 2)
  }
  const pcm = Buffer.concat(data), chunks: Buffer[] = []
  for (let offset = 0; offset < pcm.length; offset += 15 * 32000) {
    chunks.push(pcmWav(pcm.subarray(Math.max(0, offset - (offset ? 16000 : 0)), Math.min(pcm.length, offset + 15 * 32000))))
  }
  return chunks
}

export function joinVoiceText(parts: string[]): string {
  const words: string[] = []
  const normalized = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')
  for (const part of parts) {
    const next = part.trim().split(/\s+/).filter(Boolean)
    let overlap = 0
    for (let n = Math.min(12, words.length, next.length); n > 0; n--) {
      if (words.slice(-n).every((word, i) => normalized(word) === normalized(next[i]))) { overlap = n; break }
    }
    words.push(...next.slice(overlap))
  }
  return words.join(' ')
}

/** Reserve the maximum bounded output and conservative input budget, including retries. */
export function voiceBudget(chunks: number) {
  return chunks * VOICE_ATTEMPTS * (VOICE_OUTPUT_TOKENS + 2048)
}
export function wavSeconds(bytes: Uint8Array): number | null {
  const b = Buffer.from(bytes)
  if (b.length < 44 || b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WAVE') return null
  let validFormat = false, dataBytes = 0
  for (let at = 12; at + 8 <= b.length;) {
    const name = b.toString('ascii', at, at + 4), size = b.readUInt32LE(at + 4)
    const begin = at + 8
    if (size > b.length - begin) return null
    if (name === 'fmt ') {
      if (size < 16) return null
      validFormat = b.readUInt16LE(begin) === 1 && b.readUInt16LE(begin + 2) === 1 &&
        b.readUInt32LE(begin + 4) === 16000 && b.readUInt16LE(begin + 14) === 16
    }
    if (name === 'data') dataBytes += size
    at = begin + size + (size % 2)
  }
  const seconds = dataBytes / 32000
  return validFormat && dataBytes % 2 === 0 && seconds >= .2 && seconds <= 31 ? seconds : null
}
