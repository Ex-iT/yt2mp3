import { ClientType, Innertube, UniversalCache } from 'youtubei.js'

let yt: Innertube | null = null

export async function getInnerTubeSession(): Promise<Innertube> {
  if (!yt) {
    yt = await Innertube.create({
      client_type: ClientType.ANDROID,
      cache: new UniversalCache(false),
      generate_session_locally: true,
      enable_session_cache: true,
    })
  }
  return yt
}

export function resetInnerTubeSession(): void {
  yt = null
}
