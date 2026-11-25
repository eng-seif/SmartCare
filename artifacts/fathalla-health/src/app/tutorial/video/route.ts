import { tutorialVideoUrl } from '@/lib/tutorial-storage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const url = tutorialVideoUrl()
  if (url) {
    return Response.redirect(url, 307)
  }
  return Response.json(
    { error: 'Tutorial is unavailable. You can skip it and continue.' },
    { status: 503, headers: { 'Cache-Control': 'no-store' } },
  )
}
