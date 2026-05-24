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
server/utils/youtube.ts      — Shared YouTube helpers (tryClient, extractVideo, reExtractAudioUrl, fetchAudioUrl, parseYouTubeId, MIME maps)
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
- Retries up to 3 rounds across ANDROID → WEB → IOS → MWEB → TV_EMBEDDED clients
- 2s delay between client attempts, 5s delay between rounds
- Resets InnerTube session between rounds; sessions cached via `UniversalCache(false)`

### POST /api/download

- **Body**: `{ url: string, mimeType: string, title: string, videoId?: string }`
- Proxies the CDN audio URL with Android User-Agent headers and exponential backoff (2s, 4s, 8s) on 429
- If the CDN URL fails, fallback re-extracts a fresh URL using `videoId` (across ANDROID, WEB, IOS)
- Streams audio back as a downloadable file with proper `Content-Disposition`

## Data Flow

1. User pastes YouTube URL or bare video ID → `UrlInput.vue` validates format
2. `useExtractAudio().extract(url)` → POST `/api/extract`
3. Server calls `extractVideo(videoId)` — retries 5 client types across up to 3 rounds with session resets
4. Returns `{ title, uploader, duration, thumbnails, bestAudio, audioStreams }`
5. `VideoInfo.vue` displays metadata
6. User clicks Download → `useExtractAudio().download()` sends CDN URL + videoId to `/api/download`
7. Server tries CDN URL with Android User-Agent (exponential backoff on 429); if it fails, re-extracts a fresh URL via InnerTube (ANDROID → WEB → IOS)
8. Audio is streamed back to the browser as a blob download

## Extraction Strategy

- Session created with `ClientType.ANDROID` using `UniversalCache(false)` + `generate_session_locally: true` to avoid redundant session-fetch requests
- Uses raw InnerTube `/player` endpoint directly (not `getBasicInfo`) to ensure streaming URLs are returned
- Client rotation: ANDROID → WEB → IOS → MWEB → TV_EMBEDDED (5 clients in extract, 3 in download fallback)
- Audio format is chosen by highest bitrate
- 3 retry rounds with 2s delay between clients, 5s delay between rounds
- Session is invalidated and recreated between rounds if all clients in a round fail
- CDN audio fetches use exponential backoff (2s, 4s, 8s) on 429 responses

## Caching

- Session data cached in `UniversalCache(false)` (uses OS temp dir, compatible with Vercel's ephemeral `/tmp`)
- Session cache avoids re-fetching YouTube's `/sw.js_data` endpoint on repeated calls within the same process
- CDN URL responses are **not** cached — each download request gets a fresh fetch

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
- Cycling between 5 client types (ANDROID, WEB, IOS, MWEB, TV_EMBEDDED) — each uses a different API profile
- Invalidating and recreating the InnerTube session between retry attempts (forces fresh visitor data)
- Adding delays between attempts (2s between clients, 5s between full attempts)
- CDN audio fetches use exponential backoff on 429: 2s → 4s → 8s
- In the download endpoint: trying the CDN URL first (no API call), then falling back to re-extraction only if the CDN URL fails
- Session caching via `UniversalCache` reduces redundant session-fetch requests
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
