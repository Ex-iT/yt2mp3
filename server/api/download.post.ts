import { Readable } from 'node:stream'
import { MIME_TO_EXT, sanitize, tryClient } from '~/server/utils/youtube'

async function fetchAudioUrl(audioUrl: string) {
  try {
    const res = await fetch(audioUrl, {
      headers: {
        'User-Agent': 'com.google.android.youtube/21.03.36 (Linux; U; Android 14; en_US)',
        'Accept': '*/*',
        'Referer': 'https://www.youtube.com/',
      },
      signal: AbortSignal.timeout(30000),
    })
    if (!res.ok || !res.body) {
      return null
    }
    return res
  }
  catch {
    return null
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody<{ url: string, mimeType: string, title: string, videoId?: string }>(event)
  const { url, mimeType, title, videoId } = body

  if (!url || !url.startsWith('https://')) {
    throw createError({ statusCode: 400, message: 'Invalid download URL' })
  }

  const ext = MIME_TO_EXT[mimeType] ?? 'webm'
  const filename = `${sanitize(title ?? 'audio')}.${ext}`

  let audioResponse = await fetchAudioUrl(url)

  if (!audioResponse && videoId) {
    const { getInnerTubeSession, resetInnerTubeSession } = await import('~/server/utils/innertube')
    const clients = ['ANDROID', 'WEB'] as const
    for (let attempt = 0; attempt < 2 && !audioResponse; attempt++) {
      try {
        const yt = await getInnerTubeSession()
        for (const client of clients) {
          const result = await tryClient(videoId, yt, client)
          if (result) {
            const freshUrl = result.audioFormats.sort((a: any, b: any) => b.bitrate - a.bitrate)[0]?.url
            if (freshUrl) {
              audioResponse = await fetchAudioUrl(freshUrl)
              if (audioResponse)
                break
            }
          }
        }
      }
      catch {
        // InnerTube call failed (rate limited), continue to next attempt
      }
      resetInnerTubeSession()
    }
  }

  if (!audioResponse) {
    throw createError({
      statusCode: 502,
      message: 'YouTube is rate-limiting this IP. Please wait a minute and try again.',
    })
  }

  setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`)
  setHeader(event, 'Content-Type', mimeType || 'audio/webm')
  const cl = audioResponse.headers.get('content-length')
  if (cl) {
    setHeader(event, 'content-length', Number(cl))
  }

  return sendStream(event, Readable.from(audioResponse.body as any))
})
