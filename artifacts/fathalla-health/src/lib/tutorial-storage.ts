export function tutorialVideoUrl() {
  const url = process.env.TUTORIAL_VIDEO_URL?.trim()
  return url && /^https?:\/\//i.test(url) ? url : null
}
