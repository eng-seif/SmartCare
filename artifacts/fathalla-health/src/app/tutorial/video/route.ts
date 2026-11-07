import { tutorialFile } from '@/lib/tutorial-storage'
import { Readable } from 'node:stream'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const file = tutorialFile()
    const [meta] = await file.getMetadata()
    const size = Number(meta.size)
    const range = request.headers.get('range')
    let start = 0, end = size - 1
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range)
      if (!match || (!match[1] && !match[2])) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } })
      if (!match[1]) start = Math.max(0, size - Number(match[2]))
      else { start = Number(match[1]); if (match[2]) end = Math.min(end, Number(match[2])) }
      if (start > end || start >= size) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } })
    }
    const stream = Readable.toWeb(file.createReadStream({ start, end })) as ReadableStream<Uint8Array>
    return new Response(stream, {
      status: range ? 206 : 200,
      headers: {
        'Content-Type': 'video/mp4', 'Accept-Ranges': 'bytes',
        'Content-Length': String(end - start + 1),
        'Cache-Control': 'public, max-age=3600',
        ...(range ? { 'Content-Range': `bytes ${start}-${end}/${size}` } : {}),
      },
    })
  } catch {
    return Response.json({ error: 'Tutorial is unavailable. You can skip it and continue.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
