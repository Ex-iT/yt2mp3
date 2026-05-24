export interface AudioStream {
  url: string
  mimeType: string
  bitrate: number
  format: string
  quality: string
  itag: number
}

export interface Thumbnail {
  url: string
  width: number
  height: number
}

export interface ExtractResponse {
  title: string
  uploader: string
  duration: number
  thumbnails: Thumbnail[]
  bestAudio: AudioStream
  audioStreams: AudioStream[]
}
