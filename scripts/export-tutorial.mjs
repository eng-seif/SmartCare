// Platform recording helper. Does not change the video composition.
import { spawn } from 'node:child_process'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { once } from 'node:events'

const out = 'generated-artifacts/tutorial-recording'
await mkdir(`${out}/frames`, { recursive: true })
const port = 9437
const chrome = spawn('/repl/tools/bin/chromium', [
  '--headless', '--no-sandbox', '--disable-dev-shm-usage',
  '--autoplay-policy=no-user-gesture-required', '--hide-scrollbars',
  '--window-size=1280,720', `--remote-debugging-port=${port}`,
  `--user-data-dir=${process.cwd()}/.local/tutorial-recorder-profile`,
  'about:blank',
], { stdio: 'ignore' })
let ws
try {
  let targets
  for (let i = 0; i < 100; i++) {
    try { targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); if (targets.length) break } catch {}
    await new Promise(r => setTimeout(r, 100))
  }
  if (!targets?.length) throw new Error('Recording browser did not start')
  ws = new WebSocket(targets[0].webSocketDebuggerUrl)
  await once(ws, 'open')
  let id = 0, recording = false, finished
  const pending = new Map(), frames = [], writes = []
  const done = new Promise(resolve => { finished = resolve })
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const n = ++id; pending.set(n, { resolve, reject })
      ws.send(JSON.stringify({ id: n, method, params }))
    })
  }
  ws.onmessage = event => {
    const m = JSON.parse(event.data)
    if (m.id && pending.has(m.id)) {
      const p = pending.get(m.id); pending.delete(m.id)
      if (m.error) p.reject(new Error(JSON.stringify(m.error))); else p.resolve(m.result)
    }
    if (m.method === 'Runtime.consoleAPICalled') {
      const values = m.params.args.map(x => x.value)
      console.log('Browser console:', values.filter(x => typeof x === 'string').join(' ').slice(0, 300))
      if (values.includes('TUTORIAL_RECORD_START')) recording = true
      if (values.includes('TUTORIAL_RECORD_END') && recording) { recording = false; finished() }
    }
    if (m.method === 'Runtime.exceptionThrown') console.log('Browser exception:', JSON.stringify(m.params.exceptionDetails).slice(0, 900))
    if (m.method === 'Page.screencastFrame') {
      if (recording) {
        const file = `frames/frame-${String(frames.length).padStart(5, '0')}.jpg`
        frames.push({ file, at: m.params.metadata.timestamp })
        writes.push(writeFile(`${out}/${file}`, Buffer.from(m.params.data, 'base64')))
      }
      void send('Page.screencastFrameAck', { sessionId: m.params.sessionId })
    }
  }
  await send('Page.enable'); await send('Runtime.enable')
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false })
  const url = 'http://127.0.0.1:80/fathalla-tutorial/'
  await send('Page.navigate', { url })
  await new Promise(r => setTimeout(r, 5000))
  await send('Runtime.evaluate', { expression: 'document.fonts.ready', awaitPromise: true })
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `window.startRecording=async()=>console.log('TUTORIAL_RECORD_START'); window.stopRecording=()=>console.log('TUTORIAL_RECORD_END');`,
  })
  await send('Page.startScreencast', { format: 'jpeg', quality: 85, maxWidth: 1280, maxHeight: 720, everyNthFrame: 2 })
  await send('Page.reload', { ignoreCache: false })
  let timer
  await Promise.race([done, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Video recording markers timed out')), 55000) })])
  clearTimeout(timer)
  await send('Page.stopScreencast')
  await Promise.all(writes)
  if (frames.length < 100) throw new Error(`Too few recorded frames: ${frames.length}`)
  let concat = ''
  for (let n = 0; n < frames.length; n++) {
    const duration = n + 1 < frames.length ? Math.max(.001, frames[n + 1].at - frames[n].at) : .1
    concat += `file '${frames[n].file}'\nduration ${duration.toFixed(6)}\n`
  }
  concat += `file '${frames.at(-1).file}'\n`
  await writeFile(`${out}/frames.txt`, concat)
  await writeFile(`${out}/capture.json`, JSON.stringify({ count: frames.length, span: frames.at(-1).at - frames[0].at }))
  console.log(`Captured ${frames.length} real-time frames`)
  ws.close(); chrome.kill()
  const ffmpeg = spawn('ffmpeg', [
    '-y', '-f', 'concat', '-safe', '0', '-i', `${out}/frames.txt`,
    '-i', 'artifacts/fathalla-tutorial/public/audio/bg_music.mp3',
    '-map', '0:v:0', '-map', '1:a:0', '-vf', 'fps=24,format=yuv420p',
    '-c:v', 'libx264', '-preset', 'fast', '-crf', '23', '-threads', '2',
    '-c:a', 'aac', '-b:a', '96k', '-t', '31', '-movflags', '+faststart',
    `${out}/fathalla-tutorial.mp4`,
  ], { stdio: ['ignore', 'ignore', 'inherit'] })
  const [code] = await once(ffmpeg, 'exit')
  if (code !== 0) throw new Error(`Video encoding failed: ${code}`)
  console.log(`MP4 ready: ${out}/fathalla-tutorial.mp4`)
} finally {
  ws?.close()
  chrome.kill()
}
