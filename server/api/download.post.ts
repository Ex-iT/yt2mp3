import { Readable } from 'node:stream'
import { DOWNLOAD_CLIENTS, fetchAudioUrl, MIME_TO_EXT, reExtractAudioUrl, sanitize } from '~/server/utils/youtube'

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
