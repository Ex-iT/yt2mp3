import { Readable } from 'node:stream'
import { DOWNLOAD_CLIENTS, fetchAudioUrl, MIME_TO_EXT, reExtractAudioUrl, sanitize } from '~/server/utils/youtube'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ url?: string, urls?: string[], mimeType: string, title: string, videoId?: string }>(event)
  const { url, urls, mimeType, title, videoId } = body

  const ext = MIME_TO_EXT[mimeType] ?? 'webm'
  const filename = `${sanitize(title ?? 'audio')}.${ext}`

  // Build list of CDN URLs to try, best first
  const cdnUrls = urls?.length ? urls : url ? [url] : []
  if (cdnUrls.length === 0) {
    throw createError({ statusCode: 400, message: 'No download URLs provided' })
  }

  // Try each CDN URL in order until one works
  let audioResponse: Response | null = null
  for (const cdnUrl of cdnUrls) {
    audioResponse = await fetchAudioUrl(cdnUrl)
    if (audioResponse)
      break
  }

  // If all CDN URLs failed, attempt re-extraction via InnerTube
  if (!audioResponse && videoId) {
    audioResponse = await reExtractAudioUrl(videoId, DOWNLOAD_CLIENTS)
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

  return sendStream(event, Readable.from(audioResponse.body as unknown as ReadableStream))
})
