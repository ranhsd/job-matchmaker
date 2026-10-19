# התאמה בקליק – התאמת משרות בשירות המדינה לקורות חיים

Upload a CV (PDF / DOCX / TXT / image), optionally narrow the search by tender type, area, job scope, professional field and job level, and get the open Israeli Civil Service positions that fit it. Results are grouped into three categories: positions relevant to the candidate's experience, positions worth checking, and opportunities in adjacent fields. Each position comes with a Hebrew explanation of why it is relevant, what was found in the CV, and which requirements are worth checking before applying.

Positions are read live from the public OData API behind the Civil Service recruitment site ([merkava.mrp.gov.il/giusp](https://merkava.mrp.gov.il/giusp/index.html#/)). This project is not affiliated with the Civil Service Commission.

## Tech stack

| Layer | Tech |
| --- | --- |
| Monorepo | Turborepo + pnpm workspaces |
| Frontend | Vue 3, Vite, Tailwind CSS v4, Headless UI, Heroicons – Hebrew / RTL, following the "התאמה בקליק" mockup (Rubik, navy `#183b80`, blue `#3870e0`, magenta `#dc3080`) |
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
2. **Screening** – the positions that pass the user's filters are listed to one large-context call as compact lines (title, office, location, grade, professional fields, threshold requirements). It picks the ~24 most relevant, reserving about a third of the slots for positions in adjacent fields.
3. **Scoring** – the shortlist is scored in parallel batches using the full job description and requirements. Each position is classified as `strong` (high professional fit), `possible` (fit, with things to verify), `discover` (an adjacent field worth knowing) or dropped. Each kept result has a short "why it's relevant" text, up to three pieces of evidence from the CV, and up to four requirement checks marked `supported`, `unclear` (not enough information in the CV, which does not mean the requirement is unmet) or `gap`.

If no position passes the filters, the stream ends with an empty result and the site shows the "no matches" message.

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

`filters` (all optional): `{ "audience": "public" | "employees", "area": "ירושלים", "jobScope": "full" | "partial", "field": "כלכלה", "level": "משרת ביניים", "notes": "free text preferences" }`

- `audience`: `public` (default) keeps public tenders only. `employees` includes internal tenders too, because civil servants can also apply to public ones.
- `jobScope`: `full` is a 100% position, `partial` is anything below.
- `field` matches the position's professional fields (`Tags1`–`Tags5`) and `level` matches `LevelName`. About half the positions have no level, so choosing a level excludes them.

Errors carry a `code`: `file` when the CV could not be read or does not look like a CV, and `search` for anything else (rate limits, model or upstream failures). HTTP errors return `{ "error", "code" }` and stream errors send `{ "type": "error", "code", "message" }`.

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

### Environment variables (web, build time)

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_API_URL` | `/api` | API base URL. The deploy workflow sets it to the Cloud Run URL. |
| `VITE_SURVEY_URL` | unset | Link for the feedback survey card under the results. The card is hidden when unset. The deploy workflow reads it from the `SURVEY_URL` repository variable. |

## Deploying

A push to `main` runs `.github/workflows/deploy.yml`. It builds the API image and deploys Cloud Run on `sigma-matchmaker-dev`, then builds the site with that API URL and deploys Firebase Hosting on the same project. The browser calls Cloud Run directly. Hosting does not proxy `/api`, because those rewrites stop at 60 seconds and a match takes longer.

The API project already has the Artifact Registry repository, the Cloud Run runtime service account, and the Gemini key in Secret Manager (`gemini-api-key`). GitHub signs in as `mrkcaptcha@merkava.gov.il` using the `GCP_USER_CREDENTIALS` secret. That account can deploy Cloud Run on `sigma-matchmaker-dev` and owns the Firebase project. This project does not allow creating a separate deploy service account key or a Workload Identity pool.

The site is `https://sigma-matchmaker-dev.web.app`. The API allows that host and `https://sigma-matchmaker-dev.firebaseapp.com`. The Gemini key is not a GitHub secret.

## Limitations / next steps

- The rate limiter is in-memory per Cloud Run instance. With one minimum instance it holds for the life of that instance. It is not shared if the service scales out.
- The positions cache is also in memory. The minimum instance keeps it warm.
- Legacy `.doc` files are not supported; users are asked to save as DOCX or PDF.
