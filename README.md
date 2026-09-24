# השדכן החכם שלי – התאמת משרות בשירות המדינה לקורות חיים

Upload a CV (PDF / DOCX / TXT / image) and get the open Israeli Civil Service positions that fit it best, ranked with a match score, a threshold-requirements check, and a Hebrew explanation of why each position fits and what may be missing.

Positions are read live from the public OData API behind the Civil Service recruitment site ([merkava.mrp.gov.il/giusp](https://merkava.mrp.gov.il/giusp/index.html#/)). This project is not affiliated with the Civil Service Commission.

## Tech stack

| Layer | Tech |
| --- | --- |
| Monorepo | Turborepo + pnpm workspaces |
| Frontend | Vue 3, Vite, Tailwind CSS v4, Headless UI, Heroicons – Hebrew / RTL, styled after the gov recruitment site (Rubik, navy `#0c2e4b`, accent `#0574d6`) |
| Backend | Node.js + Hono (streams progress as NDJSON) |
| LLM | Google Gemini `gemini-3.5-flash-lite` via the Vercel AI SDK |
| Hosting | Vercel (static frontend + one serverless function), free Hobby plan |

```
apps/
  api/        Hono API (local server: src/server.ts, app: src/app.ts)
  web/        Vue 3 SPA
packages/
  shared/     Types shared by API and web (types only, no build step)
api/index.ts  Vercel function entry – re-exports the Hono app
vercel.json   Build + routing config for Vercel
```

## How matching works

The pipeline reads **every** open position while keeping cost low:

1. **Profile** – Gemini reads the CV and extracts a structured profile (education, years of experience, skills, licenses, domains). PDFs and images are sent to Gemini as-is, which handles Hebrew/RTL PDFs far better than text extraction. DOCX is converted with `mammoth`.
2. **Screening** – one large-context call sees a compact line for every open position (title, office, location, grade, tags, threshold requirements) and picks the ~24 most relevant.
3. **Scoring** – the shortlist is scored in parallel batches using the full job description and requirements. Each result gets a 0–100 score, fit level, whether the threshold requirements (דרישות סף) are met, reasons, and gaps.

### Why Gemini 3.5 Flash-Lite

- Native PDF understanding, including Hebrew.
- 1M token context – the whole catalog (~390 positions, ~60K tokens) fits in one call.
- Inexpensive: $0.30 / 1M input and $2.50 / 1M output tokens. A full match costs about **$0.03–0.05**.
- Free tier (no credit card): about 500 requests/day, which is roughly 100 matches/day (each match makes 5 calls).

To trade cost for quality, set `GEMINI_SCORING_MODEL=gemini-3.8-flash` for the scoring step only.

> **Privacy note:** On Gemini's *free tier*, Google may use the submitted content to improve its products. Since CVs contain personal data, enable billing on the Google AI Studio project for production use. The cost is a few cents per match, and paid-tier data is not used for training. The app never stores the uploaded file.

## Recruitment site API (reverse-engineered)

Base: `https://merkava.mrp.gov.il/sap/opu/odata/ILG/GIUS_PUBLIC_AREA_SRV/` (SAP Gateway, OData v2, `sap-client=470`)

| Purpose | Request |
| --- | --- |
| All open positions (incl. full description & requirements) | `GET TenderDataSet?sap-client=470` |
| Single position | `GET TenderDataSet('<RequestId>')?sap-client=470` |
| Hot jobs | `GET TenderDataSet?$filter=HotJobFlg eq true` |
| Service metadata | `GET $metadata` |

Notes:
- The id in the site's position URL (`#/position/07679209`) is the **`RequestId`**, not the tender number (`TenderNumber`, e.g. `144108`). The app shows the tender number and links using the `RequestId`.
- The site's WAF blocks requests without browser-like headers, so the API client sends a browser `User-Agent`.
- The full list is ~2.7MB and takes 6–10s upstream, so the API caches it in memory for 30 minutes and serves a stale copy if the upstream fails.

## API endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Status and configured models |
| `GET` | `/api/positions` | All open positions (summary fields) |
| `GET` | `/api/positions/:requestId` | One position, with description, requirements and remarks |
| `POST` | `/api/match` | `multipart/form-data` with `file` (CV) and optional `filters` (JSON). Streams NDJSON events: `stage`, `profile`, `result`, `error` |

`filters`: `{ "publicOnly": true, "areas": ["ירושלים"], "minJobPercent": 100, "notes": "free text preferences" }`

## Local development

Requirements: Node.js ≥ 20.19, pnpm 9 (`corepack enable`).

```bash
pnpm install
cp apps/api/.env.example apps/api/.env   # then set GOOGLE_GENERATIVE_AI_API_KEY
pnpm dev                                  # API from :8788 (auto-picks if busy), web on :5173 (proxies /api)
```

Get a Gemini API key at [Google AI Studio](https://aistudio.google.com/apikey).

Other scripts: `pnpm build`, `pnpm typecheck`.

### Environment variables (API)

| Variable | Default | Description |
| --- | --- | --- |
| `GOOGLE_GENERATIVE_AI_API_KEY` | – (required) | Gemini API key |
| `GEMINI_MODEL` | `gemini-3.5-flash-lite` | Model for CV profiling and catalog screening |
| `GEMINI_SCORING_MODEL` | same as `GEMINI_MODEL` | Model for detailed scoring |
| `MATCH_SHORTLIST_SIZE` | `24` | Positions scored in depth |
| `RATE_LIMIT_PER_HOUR` | `10` | Matches per IP per hour (per serverless instance) |

## Deploying to Vercel (free)

Deploys run in GitHub Actions (`.github/workflows/deploy.yml`). A push to `main` deploys production. A pull request deploys a preview. The build runs in Actions and is uploaded with `vercel deploy --prebuilt`, so Vercel does not build the same commit again.

Leave Vercel’s Git integration disconnected, or turn off its automatic Production and Preview deployments. Otherwise every push builds twice.

`vercel.json` already sets the install and build commands, the output directory (`apps/web/dist`), and the `/api/*` rewrite. Root Directory stays the repo root.

GitHub repository secrets (Settings → Secrets and variables → Actions):

| Secret | Where to get it |
| --- | --- |
| `VERCEL_TOKEN` | [Account tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Team Settings → Team ID, or `orgId` in `.vercel/project.json` after `vercel link` |
| `VERCEL_PROJECT_ID` | Project Settings → General → Project ID |

Vercel project environment variable, for both Production and Preview: `GOOGLE_GENERATIVE_AI_API_KEY`. The workflow pulls it with `vercel pull`. Do not put that key in GitHub.

Hobby plan limits to be aware of: 4.5MB request bodies (the app caps CVs at 4MB) and function duration (set to 120s in `vercel.json`; a match usually takes 20–60s).

## Limitations / next steps

- The rate limiter is in-memory per serverless instance. Use Upstash Redis or Vercel KV for a strict global limit.
- The positions cache is also per instance. A scheduled job (Vercel Cron) could snapshot positions to KV/Blob so every request is warm.
- Legacy `.doc` files are not supported; users are asked to save as DOCX or PDF.
