import type { ExtractResponse } from '~/types/youtube'

const mimeToExtension: Record<string, string> = {
  'audio/webm': 'webm',
  'audio/mp4': 'm4a',
  'audio/ogg': 'ogg',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/flac': 'flac',
}

function sanitizeFilename(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, '_').slice(0, 200)
}

function parseVideoId(url: string): string | null {
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

export function useExtractAudio() {
  const loading = ref(false)
  const downloading = ref(false)
  const error = ref<string | null>(null)
  const data = ref<ExtractResponse | null>(null)
  const videoId = ref<string | null>(null)

  async function extract(url: string): Promise<void> {
    loading.value = true
    error.value = null
    data.value = null
    videoId.value = parseVideoId(url)

    try {
      const response = await $fetch<ExtractResponse>('/api/extract', {
        method: 'POST',
        body: { url },
      })
      data.value = response
    }
    catch (err: any) {
      error.value = err.data?.message ?? err.message ?? 'Failed to extract audio'
    }
    finally {
      loading.value = false
    }
  }

  async function download(): Promise<void> {
    if (!data.value)
      return

    const stream = data.value.bestAudio
    downloading.value = true

    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: stream.url,
          mimeType: stream.mimeType,
          title: data.value.title,
          videoId: videoId.value,
        }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.message || `Download failed (${response.status})`)
      }

      const blob = await response.blob()

      const ext = mimeToExtension[stream.mimeType] ?? 'webm'
      const filename = `${sanitizeFilename(data.value.title)}.${ext}`
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)
    }
    catch (err: any) {
      error.value = err.message ?? 'Download failed'
    }
    finally {
      downloading.value = false
    }
  }

  function reset(): void {
    loading.value = false
    downloading.value = false
    error.value = null
    data.value = null
    videoId.value = null
  }

  return {
    extract,
    download,
    loading: readonly(loading),
    downloading: readonly(downloading),
    error: readonly(error),
    data,
    reset,
  }
}
