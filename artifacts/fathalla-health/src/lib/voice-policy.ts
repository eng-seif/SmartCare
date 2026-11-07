export const MAX_VOICE_BYTES = 1_050_000
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
