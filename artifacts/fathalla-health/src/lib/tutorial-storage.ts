import { Storage } from '@google-cloud/storage'

// Official Replit sidecar authentication; no keys are shipped to clients.
const sidecar = 'http://127.0.0.1:1106'
export const tutorialStorage = new Storage({
  credentials: {
    audience: 'replit',
    subject_token_type: 'access_token',
    token_url: `${sidecar}/token`,
    type: 'external_account',
    credential_source: {
      url: `${sidecar}/credential`,
      format: { type: 'json', subject_token_field_name: 'access_token' },
    },
    universe_domain: 'googleapis.com',
  },
  projectId: '',
})
export function tutorialFile() {
  const path = process.env.PUBLIC_OBJECT_SEARCH_PATHS?.split(',')[0]?.trim().replace(/^\/+|\/+$/g, '')
  if (!path) throw new Error('Tutorial storage is not configured')
  const [bucket, ...parts] = path.split('/')
  return tutorialStorage.bucket(bucket).file([...parts, 'tutorial/fathalla-intro-v1.mp4'].join('/'))
}
