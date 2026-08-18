# Skibidi IELTS

Production-oriented MVP for learners progressing from approximately IELTS Band 3.5 to 6.5+. The application focuses on two products: Reading-oriented vocabulary and AI-assisted IELTS Academic Writing feedback.

The implementation intentionally avoids generic SaaS decoration: no gradients, gamification, testimonials, fake statistics, chatbots, social login, or unnecessary dashboards.

## Stack

- Next.js App Router + React + strict TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma ORM with the PostgreSQL driver adapter
- Username/password authentication with Argon2id
- Database-backed HTTP-only sessions
- Gemini behind a `GradingProvider` abstraction
- Zod validation for requests and AI JSON output
- Vitest + Testing Library scaffolding

## Implemented MVP flows

### Authentication

- Register using username, password, and password confirmation
- Case-insensitive unique usernames using a normalized username column
- No email, Google login, email verification, or forgot-password flow
- Argon2id password hashes
- Login rate limiting
- HTTP-only, SameSite session cookies
- User and Admin roles with server-side route/action authorization
- Change password and log out
- Admin password reset

### Vocabulary

- Level 1: IELTS 3.5 -> 5.0 learner path
- Level 2: IELTS 5.0 -> 6.5 learner path
- 12 core topics and 6 additional topics per level
- Independent progress by level and word
- `NOT_LEARNED`/`LEARNED` behavior through a boolean progress record
- All / Not learned / Learned filters
- Topic search
- Compact responsive word UI and details
- British-English browser speech synthesis behind stored audio-provider metadata
- Full access for Free and Pro
- Admin topic/vocabulary CRUD
- Idempotent seed architecture with global normalized-lemma deduplication

The included seed is deliberately a **starter curated dataset**, not the final full 45-75/35-60 words-per-topic content pack. Expand it before a public content-complete launch; the schema, admin CRUD, deduplication, and per-topic limits are already in place.

### IELTS Writing

- Academic Task 1 and Task 2
- Separate question and Writing uploads
- 5 MB limit per file
- Question: JPG/JPEG/PNG/WebP/PDF
- Writing: JPG/JPEG/PNG/WebP/PDF/TXT/DOCX
- Direct essay editor with live word count
- Direct Task 2 question text
- Original uploads are processed in request memory and are never persisted as blobs/files
- TXT/DOCX text is extracted server-side; image/PDF content is passed to the multimodal provider
- Extracted question text, structured Task 1 data, essay text, scores, feedback, and metadata are persisted

The grading pipeline is split into distinct stages:

1. input extraction / Task 1 visual interpretation
2. four independent IELTS criterion scores
3. verification pass that checks generosity, harshness, inconsistency, and prompt misunderstanding
4. Band 7 sample generation
5. Pro-only detailed analysis, improved essay, and next-band guidance

All model responses are requested as structured JSON and validated again with Zod before persistence. User-facing scores are labeled as estimated results, not official IELTS results.

### Writing quota and entitlement rules

- Free: 3 successful evaluations per 30-day Free cycle
- Pro: 10 successful evaluations per 30-day Pro cycle
- Pro price: 50,000 VND / 30 days
- Quota is reserved before expensive grading and consumed only in the transaction that persists a successful completed result
- Failed upload/extraction/model/validation/unreadable-image cases release the reservation and do not consume quota
- PostgreSQL advisory locks plus reservation counting prevent concurrent submissions from bypassing quota
- Reopening history never consumes quota
- Early Pro renewals append a new 30-day period after the currently scheduled Pro expiry instead of discarding remaining time
- Expired Pro returns to a fresh Free cycle; existing Writing history and generated Pro feedback remain stored

### Manual Pro payment

- Unique transfer code per payment order
- PENDING -> AWAITING_VERIFICATION after the user says the transfer is complete
- That user action never activates Pro
- Admin confirm -> PAID + Pro activation/extension in a database transaction
- Admin reject support
- Admin can grant/extend/revoke Pro and set a custom expiry
- Bank/QR configuration may be stored as safe app settings or initialized via environment variables
- Secrets stay in environment variables

### Admin

- Users and plan/quota information
- Manual Pro controls and password reset
- Payments and confirmation/rejection
- Vocabulary CRUD
- Writing API-usage summary
- Learner problem reports with OPEN/REVIEWED/RESOLVED state

## Project structure

```text
prisma/
  schema.prisma        Database schema
  seed.ts              Idempotent starter vocabulary seed
scripts/
  promote-admin.ts     Secure CLI admin promotion
src/app/               App Router pages and route handlers
src/components/        Reusable accessible UI components
src/lib/auth/          Authentication/session/rate limiting
src/lib/ai/            GradingProvider + Gemini implementation + schemas
src/lib/entitlements/  Free/Pro cycles and quota reservation/consumption
src/lib/files/         Upload validation and temporary extraction
src/lib/payments/      Manual QR order + Pro period business logic
src/lib/vocabulary/    Vocabulary queries/progress
src/lib/writing/       Grading orchestration, reports, band calculation
 tests/evaluation/     Calibration fixture format
```

## Local setup

Requirements: Node.js 22+, npm, and PostgreSQL.

```bash
npm install
cp .env.example .env
```

Create a PostgreSQL database and update `DATABASE_URL` in `.env`.

Generate the Prisma client and create the first migration:

```bash
npm run db:generate
npm run db:migrate -- --name init
npm run db:seed
```

Run development mode:

```bash
npm run dev
```

Production validation/build:

```bash
npm run audit:static
npm run typecheck
npm run test
npm run lint
npm run build
```

For production migrations use:

```bash
npm run db:deploy
```

## Environment variables

See `.env.example`.

```dotenv
DATABASE_URL=
SESSION_SECRET=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.7-flash
APP_URL=
BANK_NAME=
BANK_ACCOUNT_NUMBER=
BANK_ACCOUNT_HOLDER=
BANK_QR_IMAGE_URL=
PRO_PRICE_VND=50000
```

Generate a long random `SESSION_SECRET`; never commit real secrets.

`GEMINI_MODEL` is configuration, not business logic. The application code only depends on the `GradingProvider` interface, so the provider/model can be changed later without rewriting Writing pages, quota, history, or payment logic.

## Gemini setup

1. Create an API key in Google AI Studio / the Gemini Developer API.
2. Put it in `GEMINI_API_KEY`.
3. Keep `GEMINI_MODEL` set to a currently supported multimodal Flash model. The repository defaults to `gemini-3.7-flash` as of August 2026.
4. Do not expose the API key in any `NEXT_PUBLIC_*` variable.

Free-tier limits are controlled by Google and may change, so check the current Gemini pricing/rate-limit pages before public launch.

## Bank QR setup

For the simplest MVP, set the bank fields in `.env`. `BANK_QR_IMAGE_URL` should point to a QR image you are legally allowed to serve. The payment page also shows the exact amount and generated transfer content.

The database `AppSetting` model can later hold safe runtime configuration such as bank name, account number, holder, QR URL, and Pro price. API keys must remain environment-only.

## Create the first Admin

There is intentionally no public Create Admin page.

1. Register a normal account in the app.
2. Run:

```bash
npm run admin:promote -- your_username
```

The script finds the normalized username and changes its role to `ADMIN` server-side.

## Privacy behavior

Writing content may be sent to the configured AI provider to generate feedback. Uploaded originals are processed temporarily and are not retained after processing. The app stores extracted question text, structured Task 1 data where relevant, essay text, and generated feedback in Writing History. Usernames are not included in grading prompts.

For a real launch, publish provider-specific privacy/retention terms and confirm that your selected Gemini account/tier meets your privacy requirements.

## Writing calibration

`tests/evaluation/` is reserved for developer-curated sample essays containing:

- exact IELTS task
- learner essay
- expected criterion bands
- human evaluator notes

Use those fixtures to track exact band match, within-0.5 match, and criterion disagreement. Do not market AI grading as perfectly accurate.

## Validation status in this generated workspace

The source was statically reviewed and includes strict TypeScript/test/build scripts. This sandbox did not have working npm registry access, so dependencies could not be installed and Prisma client generation / `next build` / Vitest could not be executed here. Run the production validation commands above after `npm install` in a networked development environment and fix any version-specific diagnostics before deployment.

## Recommended pre-launch work

1. Expand and human-review the Vocabulary seed to the desired per-topic content volume.
2. Build a real IELTS calibration set reviewed by qualified human markers and tune the grading prompts against it.
3. Run migrations, tests, lint, typecheck, and production build with installed dependencies.
4. Test real Gemini image/PDF inputs and intentionally blurry/cropped Task 1 tasks.
5. Test concurrent quota submission, payment double-confirmation, early renewal, Pro expiry, and Admin authorization against a real PostgreSQL instance.
6. Configure production cookie/TLS settings, reverse-proxy IP handling, database backups, observability, and deployment secrets.

## Beginner one-click-style Render deployment

For the prepared public-beta flow, see `PUBLISH-NO-CODE.md` and `render.yaml`.
The Render build script automatically installs dependencies, generates Prisma Client, pushes the initial schema to PostgreSQL, seeds starter vocabulary, and builds Next.js. This is intended to remove local Terminal/database setup for a first beta deploy.
