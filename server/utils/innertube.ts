import { ClientType, Innertube } from 'youtubei.js'

let yt: Innertube | null = null

export async function getInnerTubeSession(): Promise<Innertube> {
  if (!yt) {
    yt = await Innertube.create({
      client_type: ClientType.ANDROID,
    })
  }
  return yt
}

export function resetInnerTubeSession(): void {
  yt = null
}
