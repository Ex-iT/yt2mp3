export const MIME_TO_EXT: Record<string, string> = {
  'audio/webm': 'webm',
  'audio/mp4': 'm4a',
  'audio/ogg': 'ogg',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/flac': 'flac',
}

export function sanitize(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, '_').slice(0, 200)
}

export function mapMimeType(raw: string): string {
  return raw.split(';')[0]!.trim()
}

export function parseYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/,
    /^([\w-]{11})$/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match)
      return match[1] ?? null
  }
  return null
}

export async function tryClient(videoId: string, yt: any, client: string) {
  const raw = await yt.actions.execute('/player', {
    videoId,
    client,
    racyCheckOk: true,
    contentCheckOk: true,
  })
  const data = raw.data
  if (data?.streamingData?.adaptiveFormats) {
    const audioFmts = data.streamingData.adaptiveFormats.filter((f: any) => f.mimeType?.startsWith('audio/'))
    const withUrl = audioFmts.find((f: any) => f.url || f.cipher || f.signatureCipher)
    if (withUrl) {
      return { data, audioFormats: audioFmts }
    }
  }
  return null
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function extractVideo(videoId: string): Promise<{ data: any, audioFormats: any[] }> {
  const clients = ['ANDROID', 'WEB'] as const
  const { getInnerTubeSession, resetInnerTubeSession } = await import('~/server/utils/innertube')

  for (let attempt = 0; attempt < 3; attempt++) {
    const yt = await getInnerTubeSession()
    for (const client of clients) {
      const result = await tryClient(videoId, yt, client)
      if (result)
        return result
      await sleep(2000)
    }
    resetInnerTubeSession()
    await sleep(4000)
  }

  throw new Error('No streaming data available from any client. YouTube may be rate-limiting this IP.')
}
