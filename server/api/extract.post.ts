import { extractVideo, mapMimeType, parseYouTubeId } from '~/server/utils/youtube'

function formatFromMime(raw: string): string {
  return mapMimeType(raw).split('/')[1] ?? 'webm'
}

export default defineEventHandler(async (event) => {
  const { url } = await readBody<{ url: string }>(event)

  const videoId = parseYouTubeId(url)
  if (!url || !videoId) {
    throw createError({
      statusCode: 400,
      message: 'Invalid YouTube URL',
    })
  }

  try {
    const { data, audioFormats } = await extractVideo(videoId)

    const vd = data.videoDetails

    const bestAudio = audioFormats.sort((a: any, b: any) => b.bitrate - a.bitrate)[0]!
    const audioUrl = bestAudio.url

    const mimeType = bestAudio.mimeType

    return {
      title: vd?.title ?? 'Unknown',
      uploader: vd?.author ?? 'Unknown',
      duration: Number(vd?.lengthSeconds ?? 0),
      thumbnails: (vd?.thumbnail?.thumbnails ?? vd?.thumbnail ?? []).map((t: any) => ({
        url: t.url,
        width: t.width,
        height: t.height,
      })),
      bestAudio: {
        url: audioUrl,
        mimeType: mapMimeType(mimeType),
        bitrate: bestAudio.bitrate,
        format: formatFromMime(mimeType),
        quality: bestAudio.quality ?? '',
        itag: bestAudio.itag,
      },
      audioStreams: audioFormats.map((f: any) => ({
        url: f.url ?? '',
        mimeType: mapMimeType(f.mimeType),
        bitrate: f.bitrate,
        format: formatFromMime(f.mimeType),
        quality: f.quality ?? '',
        itag: f.itag,
      })),
    }
  }
  catch (err: any) {
    throw createError({
      statusCode: 500,
      message: err.message ?? 'Failed to extract audio from video',
    })
  }
})
