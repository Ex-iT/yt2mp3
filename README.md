# yt2mp3

[![Vercel](https://vercelbadge.vercel.app/api/ex-it/yt2mp3)](https://yt2mp3.ex-it.nl)
[![CI](https://img.shields.io/github/actions/workflow/status/Ex-iT/yt2mp3/ci.yml?branch=main&label=CI&logo=github)](https://github.com/Ex-iT/yt2mp3/actions)

Extract audio from YouTube videos. Paste a URL, download the audio in YouTube's native format (Opus/AAC).

Built with **Nuxt 4**, **Vue 3**, **TypeScript**, and **NuxtUI v4**.

## Usage

1. Paste a YouTube URL (watch, embed, shorts, youtu.be) or a bare video ID
2. Click **Extract** — the server fetches video metadata and stream URLs
3. Review the video info and click **Download Audio**
4. Audio is saved in YouTube's native format (no MP3 transcoding)

## Development

```bash
pnpm install
pnpm dev
```

## Commands

| Command | Action |
|---|---|
| `pnpm dev` | Start dev server at `localhost:3000` |
| `pnpm build` | Production build (Vercel preset) |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript checks |

## Deploy

```bash
vercel --prebuilt
```

## How it works

1. The server creates an Android InnerTube session via `youtubei.js`
2. When a URL is submitted, it calls YouTube's private `/player` API endpoint (retries across ANDROID/WEB clients with session reset for rate limits)
3. Audio stream URLs are extracted and returned to the client
4. Clicking **Download Audio** sends the CDN URL back to the server, which proxies the audio with proper Android User-Agent headers
5. If the CDN URL has expired or YouTube rejects it, the server re-extracts a fresh URL automatically

## License

GPL-3.0
