# התאמה בקליק – התאמת משרות בשירות המדינה לקורות חיים

Upload a CV (PDF / DOCX / TXT / image) and get the open Israeli Civil Service positions that fit it best, ranked with a match score, a threshold-requirements check, and a Hebrew explanation of why each position fits and what may be missing.

Positions are read live from the public OData API behind the Civil Service recruitment site ([merkava.mrp.gov.il/giusp](https://merkava.mrp.gov.il/giusp/index.html#/)). This project is not affiliated with the Civil Service Commission.

## Tech stack

| Layer | Tech |
| --- | --- |
| Monorepo | Turborepo + pnpm workspaces |
| Frontend | Vue 3, Vite, Tailwind CSS v4, Headless UI, Heroicons – Hebrew / RTL, styled after the gov recruitment site (Rubik, navy `#0c2e4b`, accent `#0574d6`) |
| Backend | Node.js + Hono (streams progress as NDJSON) |
| LLM | Google Gemini `gemini-3.5-flash-lite` via `@ai-sdk/google` |
| Hosting | Firebase Hosting (UI) and Cloud Run (API) on `sigma-matchmaker-dev` in `me-west1` |

```
apps/
  api/        Hono API (local server: src/server.ts, app: src/app.ts)
  web/        Vue 3 SPA
packages/
  shared/     Types shared by API and web (types only, no build step)
Dockerfile    API image for Cloud Run
firebase.json Firebase Hosting config (apps/web/dist)
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
| `RATE_LIMIT_PER_HOUR` | `10` | Matches per IP per hour (per Cloud Run instance) |
| `ALLOWED_ORIGINS` | unset | Comma-separated browser origins. Required in production so Firebase Hosting can call Cloud Run. |

## Deploying

A push to `main` runs `.github/workflows/deploy.yml`. It builds the API image and deploys Cloud Run on `sigma-matchmaker-dev`, then builds the site with that API URL and deploys Firebase Hosting on the same project. The browser calls Cloud Run directly. Hosting does not proxy `/api`, because those rewrites stop at 60 seconds and a match takes longer.

The API project already has the Artifact Registry repository, the Cloud Run runtime service account, and the Gemini key in Secret Manager (`gemini-api-key`). GitHub signs in as `mrkcaptcha@merkava.gov.il` using the `GCP_USER_CREDENTIALS` secret. That account can deploy Cloud Run on `sigma-matchmaker-dev` and owns the Firebase project. This project does not allow creating a separate deploy service account key or a Workload Identity pool.

The site is `https://sigma-matchmaker-dev.web.app`. The API allows that host and `https://sigma-matchmaker-dev.firebaseapp.com`. The Gemini key is not a GitHub secret.

## Limitations / next steps

- The rate limiter is in-memory per Cloud Run instance. With one minimum instance it holds for the life of that instance. It is not shared if the service scales out.
- The positions cache is also in memory. The minimum instance keeps it warm.
- Legacy `.doc` files are not supported; users are asked to save as DOCX or PDF.
