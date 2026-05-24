# yt2mp3

Extract audio from YouTube videos. Enter a YouTube URL, get a downloadable audio file.

## Architecture

- **Nuxt 4** static site deployed on **Vercel**
- **Vercel serverless functions** (`/api/extract` and `/api/download`) use `youtubei.js` to fetch streaming URLs and proxy audio
- **Server-side proxy download**: browser sends CDN URL to server, server fetches audio with Android User-Agent and streams it back
- **No API keys required** — session created as Android InnerTube client

## Key Directories

```
server/api/extract.post.ts   — Nitro route: extract video metadata + stream URLs
server/api/download.post.ts  — Nitro route: proxy CDN audio to client (with fallback re-extract)
server/utils/innertube.ts    — Singleton InnerTube session (ANDROID client)
server/utils/youtube.ts      — Shared YouTube helpers (tryClient, extractVideo, parseYouTubeId, MIME maps)
components/UrlInput.vue      — URL input with validation (full URL, youtu.be, bare ID)
components/VideoInfo.vue     — Displays video metadata + thumbnail
components/AudioDownloader.vue — Download button
composables/useExtractAudio.ts — Extact/download state management
types/youtube.ts             — TypeScript interfaces (AudioStream, ExtractResponse, Thumbnail)
pages/index.vue              — Main page layout
```

## API Endpoints

### POST /api/extract

- **Body**: `{ url: string }` — YouTube URL or video ID
- **Returns**: `{ title, uploader, duration, thumbnails, bestAudio, audioStreams }`
- Retries up to 3 attempts across ANDROID + WEB clients
- Resets InnerTube session between attempts to bypass rate limits

### POST /api/download

- **Body**: `{ url: string, mimeType: string, title: string, videoId?: string }`
- Proxies the CDN audio URL with Android User-Agent headers
- If the CDN URL returns non-2xx, fallback re-extracts a fresh URL using `videoId`
- Streams audio back as a downloadable file with proper `Content-Disposition`

## Data Flow

1. User pastes YouTube URL or bare video ID → `UrlInput.vue` validates format
2. `useExtractAudio().extract(url)` → POST `/api/extract`
3. Server calls `extractVideo(videoId)` → retries ANDROID + WEB clients across up to 3 attempts, resetting session between attempts
4. Returns `{ title, uploader, duration, thumbnails, bestAudio, audioStreams }`
5. `VideoInfo.vue` displays metadata
6. User clicks Download → `useExtractAudio().download()` sends CDN URL + videoId to `/api/download`
7. Server tries CDN URL with Android User-Agent; if it fails, re-extracts a fresh URL from InnerTube
8. Audio is streamed back to the browser as a blob download

## Extraction Strategy

- Session created with `ClientType.ANDROID` for maximum URL availability
- Tries ANDROID client first, falls back to WEB client
- Uses raw InnerTube `/player` endpoint directly (not `getBasicInfo`) to ensure streaming URLs are returned
- Audio format is chosen by highest bitrate
- 3 retry attempts with 2s delay between clients, 4s delay between attempts
- Rate-limited sessions are invalidated and recreated with fresh visitor data

## Commands

- `pnpm dev` — Start dev server
- `pnpm lint` — Run ESLint
- `pnpm lint:fix` — Auto-fix lint errors
- `pnpm typecheck` — Run TypeScript type checking
- `pnpm build` — Production build (Nitro preset: `vercel`)

## ESLint

Uses `@antfu/eslint-config` via `@nuxt/eslint` module. Config in `eslint.config.mjs`. The Nuxt module generates project-aware rules in `.nuxt/eslint.config.mjs` (with `standalone: false` to avoid plugin conflicts).

## Download Strategy

The browser sends the CDN URL to the server's `/api/download` endpoint. The server fetches the audio with proper Android User-Agent headers (bypassing CORS issues) and streams it back to the browser as a blob download. If the CDN URL has expired, the server re-extracts a fresh URL from InnerTube as fallback. Audio is saved in YouTube's native format (WebM/Opus or M4A/AAC), no MP3 transcoding.

## Rate Limiting

YouTube aggressively rate-limits InnerTube API calls from the same IP/session. The server handles this by:
- Cycling between ANDROID and WEB client types
- Invalidating and recreating the InnerTube session between retry attempts
- Adding delays between attempts (2s between clients, 4s between full attempts)
- In the download endpoint: trying the CDN URL first (no API call), then falling back to re-extraction only if the CDN URL fails
- Client-side: native `fetch` with explicit JSON error parsing displays the server's rate-limit message instead of a generic 502

## URL Input

The input field accepts:
- Full URLs: `https://www.youtube.com/watch?v=...` (with or without extra query params)
- Short URLs: `https://youtu.be/...`
- Bare video IDs: `dQw4w9WgXcQ`

Validation uses a single regex pattern and shows a green checkmark for valid inputs.

## Notes

- The `youtubei.js` library handles PoToken and cipher/nsig deciphering internally
- ANDROID client session is required — WEB client alone doesn't return streaming URLs for most videos
- CDN URLs are time-limited (24h expiry); the download fallback handles expired URLs
- GPL-3.0 compatible (depends on GPL-3.0 libraries)

## Dependencies

- `youtubei.js` — YouTube InnerTube API client
- `@nuxt/ui` — NuxtUI v4 component library (dark mode via `colorMode`)
- `@antfu/eslint-config` — Opinionated lint config
- `@nuxt/eslint` — Nuxt ESLint integration
