# Skibidi IELTS V2

Clean production-oriented rebuild of Skibidi IELTS for IELTS Vocabulary and AI-assisted IELTS Writing Task 1/Task 2 grading.

This codebase intentionally does **not** preserve the old Gemini-specific provider architecture, hard-coded plan names or compatibility wrappers. OpenRouter is the provider boundary; plans, features, quotas, pipeline size and model IDs are data-driven.

## Stack

- Next.js App Router + React + strict TypeScript
- Tailwind CSS
- PostgreSQL / Neon
- Prisma ORM with PostgreSQL driver adapter
- OpenRouter for all AI calls
- Zod structured-output validation
- Vitest
- Render deployment

## Repository map

```text
src/app/                 App Router pages and route handlers
src/actions/             authenticated Admin Server Actions
src/components/          learner/admin UI
src/lib/ai/              OpenRouter client, schemas, rubric and runtime pipelines
src/lib/services/        domain services and transaction boundaries
prisma/schema.prisma     relational schema
prisma/migrations/       production migrations
prisma/seed.ts           idempotent starter records
scripts/                 safe Admin maintenance scripts
tests/                   unit/contract tests
docs/                    architecture, route map and official IELTS source PDF
render.yaml              Render blueprint
```

See `docs/ARCHITECTURE.md` for the service boundaries and quota/pipeline transaction model.
See `VALIDATION.md` for the exact validation commands that were run in the delivery environment and the dependency/network blocker that prevented a certified production build.

## Official IELTS Writing rubric

The supplied **IELTS Writing Band Descriptors — Updated May 2023** is retained at:

`docs/ielts_writing_band_descriptors_may_2023.pdf`

The backend canonical representation is versioned as `IELTS_WRITING_MAY_2023` in `src/lib/ai/rubric.ts`. Task 1 uses Task Achievement + Coherence & Cohesion + Lexical Resource + Grammatical Range & Accuracy. Task 2 uses Task Response + the same other three criteria.

The examiner must score criteria independently. Multi-request pipelines allow the verifier to raise or lower the provisional bands. Feedback stages do not have band fields and cannot silently rewrite a verified score.

## Environment variables

Copy `.env.example` to `.env`.

Required in production:

```dotenv
DATABASE_URL=postgresql://...
SESSION_SECRET=<long random secret>
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=google/gemini-3.7-flash
APP_URL=https://your-app.example
```

`OPENROUTER_MODEL` is only a fallback. Normal model selection is:

1. per-stage `PlanAIConfig` override;
2. `Plan.defaultModel`;
3. `OPENROUTER_MODEL`.

API keys, passwords and session secrets are never stored in plan records.

## Local setup

Prerequisites: Node 22+, npm, and a PostgreSQL/Neon database intended for V2.

```bash
cp .env.example .env
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Do **not** point V2 at the old production database for initial development. Start with a fresh Neon database/schema/environment. The project never runs `prisma db push` in production.

## Neon setup

1. Create a separate Neon project/database for V2.
2. Copy the PostgreSQL connection string into `DATABASE_URL`.
3. Run `npm run db:deploy` on deployed environments, or `npm run db:migrate` during local development.
4. Run `npm run db:seed` once to create initial plans, settings and starter vocabulary. Seed upserts do not overwrite later Admin plan edits.

Existing V1 data is deliberately untouched. Build explicit migration tooling later only after the V1 schema is available and a mapping has been reviewed.

## OpenRouter setup

1. Create an OpenRouter API key.
2. Set `OPENROUTER_API_KEY` only in server-side environment variables.
3. Set a fallback model in `OPENROUTER_MODEL`.
4. Open **Admin → Plans → plan** and configure the plan default model or individual stage model IDs.
5. Set `aiRequestsPerSubmission` to 1–4. The next Writing submission uses the new configuration without a redeploy.

Task 1 sends the actual image/PDF as multimodal content. The AI layer does not use OCR as its primary extraction method. Select OpenRouter models that support the required image/PDF inputs and structured output for the configured stage.

### AI call diagnostics

Every stage logs safe operational metadata: logical submission ID, user/plan, stage, pipeline size, model, latency, provider status, token usage/cost when supplied, error category, prompt version and rubric version.

It does not intentionally log full essay text, file payloads, API keys, passwords or session secrets. Failed pipelines can be inspected by logical submission ID in **Admin → AI / Models**, including failures that occurred before a `WritingSubmission` row was persisted.

## Dynamic plans

`Plan` records contain:

- slug/display name/description
- VND price and duration
- Writing submission quota
- feature keys
- public/hidden/archived visibility
- display ordering and badge
- active state
- AI requests per submission
- default model and per-stage AI configuration

There is no Prisma plan-name enum. Admin-created plans work on the public pricing and entitlement path without TypeScript changes.

Seed defaults are created only by `prisma/seed.ts`:

| Plan | Price | Writing submissions | AI requests/submission |
|---|---:|---:|---:|
| Free | 0 VND | 1 seed default, Admin configurable | 1 |
| Plus | 20,000 VND | 5 | 2 |
| Pro | 50,000 VND | 10 | 3 |
| Max | 100,000 VND | 25 | 3 |
| Ultra | 500,000 VND | 100 | 3 |

A hidden plan cannot be normally purchased by new users, but existing subscription snapshots remain usable. A referenced plan is archived instead of physically deleted.

## Commercial snapshots

Payments and promo plan grants create a real `Subscription` snapshot containing:

- `planId`
- plan name at grant/purchase time
- price paid
- duration
- submission limit
- feature snapshot
- period dates

Later edits to price/quota/features do not rewrite an already-purchased entitlement. Operational AI model/pipeline settings are intentionally read from the live plan so Admin can change cost/quality strategy independently.

## Writing credit accounting

Plan and bonus submissions are separate balances. A successful Writing response consumes exactly one credit, plan quota first and bonus second.

Persistence and credit consumption occur in the same serializable transaction. AI errors, timeout, invalid structured output, unreadable Task 1 visuals and database rollback consume zero credits. The UI uses the explicit message **“No Writing submission was deducted.”** for non-success paths where appropriate.

`idempotencyKey` plus a unique constraint and a unique ledger `submissionId` prevent one logical persisted submission from consuming two credits.

## Payments

The V2 payment flow is manual by design:

1. User chooses a public plan.
2. Server creates an order and snapshots the real database price/quota/features.
3. User sees bank details, transfer code and optional QR.
4. User clicks **I've completed the transfer** → status becomes `TRANSFER_REPORTED` only.
5. Admin approves or rejects.
6. Approval grants the snapshotted subscription in the same transaction.

Configure bank details in **Admin → Settings**. `qrUrlTemplate` supports:

- `{bankCode}`
- `{accountNumber}`
- `{accountName}`
- `{amount}`
- `{reference}`

The app does not trust a client-submitted price.

## Promo codes

Exactly two reward types exist:

- `GRANT_PLAN`
- `ADD_SUBMISSIONS`

`GRANT_PLAN` creates the same subscription-snapshot entitlement model as a purchase. The safe default queues a new grant behind a current paid entitlement rather than destroying remaining paid time/quota.

`ADD_SUBMISSIONS` increases only the bonus bucket and creates a ledger entry.

Both global and per-user redemption limits are checked inside serializable transactions.

## Vocabulary

The hierarchy is database-driven:

```text
VocabularyLevel → VocabularyTopic → VocabularyWord
```

Seed data includes Level 1 (3.5→5.0), Level 2 (5.0→6.5), and Level 3 (6.5+). Admin can create additional levels. Each level/topic can use a feature gate without application changes.

Learner progress states are `NOT_STARTED`, `LEARNING`, `LEARNED`.

## Admin setup

### Initial Admin through seed

Set temporary deployment/local environment values:

```dotenv
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<at least 12 characters>
```

Then run:

```bash
npm run db:seed
```

The seed promotes/creates that user as `ADMIN`. It does not overwrite the password of an existing account on later seed runs. Remove `ADMIN_PASSWORD` from the environment after initial setup if you do not need it for future seed runs.

### Promote or demote another account

Do not pass passwords through command-line arguments.

```bash
ADMIN_TARGET_USERNAME=alice ADMIN_TARGET_ROLE=ADMIN npm run admin:role
ADMIN_TARGET_USERNAME=alice ADMIN_TARGET_ROLE=USER npm run admin:role
```

The script refuses to demote the last administrator.

### Reset a password and revoke sessions

```bash
ADMIN_TARGET_USERNAME=alice ADMIN_NEW_PASSWORD='<12+ character password>' npm run admin:password
```

## Testing

Run:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Tests cover rubric band arithmetic/locking, runtime 1–4 request pipelines, stage model fallback, Task 1 file validation/error categorization, one-credit accounting, failure=zero-credit behavior, idempotency, hidden-plan subscriber behavior, payments, promo limits, sessions and same-origin mutation protection.

Database integration tests, if added to a deployment pipeline, should use **only** a disposable `TEST_DATABASE_URL`; never point test cleanup at production. `.env.example` includes a disabled integration-test gate for that purpose.

## Render deployment

`render.yaml` uses:

```text
npm install
prisma generate
prisma migrate deploy
next build
npm start
```

In Render:

1. Create a Web Service from this repository/blueprint.
2. Set `DATABASE_URL` to the V2 Neon database.
3. Set `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` and `APP_URL`.
4. Render can generate `SESSION_SECRET` from the blueprint, or set your own high-entropy value.
5. Deploy. Migration failure stops the build; no destructive `db push` is used.
6. Run the seed as a one-off shell command if the database is fresh: `npm run db:seed`.
7. Configure payment bank details and operational AI models in Admin.

## Security notes

- passwords use bcrypt hashing;
- session cookies are HttpOnly, SameSite=Lax and Secure in production;
- authenticated mutation route handlers enforce same-origin checks;
- login attempts are rate-limited by a hashed IP+normalized-username key;
- Admin authorization is rechecked server-side for each Admin page/action;
- file MIME/type, magic-byte/signature consistency and 5 MB limits are validated server-side;
- the server resolves plan price, entitlements and credit consumption from database records;
- AI/provider errors are sanitized before normal-user output;
- raw uploaded Task 1 files are converted only for the grading request and are not stored as persistent database blobs.

## Data safety and migrations

- Use ordered Prisma migrations in `prisma/migrations`.
- Production deploy uses `prisma migrate deploy`.
- Do not run `prisma db push` against production.
- Initial V2 deployment uses a fresh database/environment.
- No automatic V1 migration is included because the V1 production schema/source was not supplied with this rebuild. Add an explicit import script only after source/target mappings are reviewed and backed up.

## Known operational limitations

- Manual transfer confirmation still requires a human Admin review; there is no bank webhook integration in V2.
- QR rendering is template/provider-based and must be configured in Admin Settings.
- Model quality/cost and image/PDF support depend on the OpenRouter model configured for each stage.
- The UI was implemented from the supplied V2 requirements. No V7 repository or screenshot set was available in the rebuild input, so pixel-for-pixel V7 visual matching cannot be verified from this package alone.
