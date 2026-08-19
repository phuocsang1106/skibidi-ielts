# Validation report

Validation date: 2026-08-19

## Release status

**Source review complete; production build is not certified in this container.**

The V2 package was reviewed again after the Render TypeScript errors were reported. The reported type errors and several additional build-risk issues found during the second pass were fixed. This container still cannot install npm dependencies because DNS resolution to `registry.npmjs.org` fails, so a real dependency-backed `typecheck`, ESLint run, Vitest run and Next.js production build cannot be truthfully claimed here.

The final gate remains the real Render/networked build.

## Render errors fixed in this revision

### 1. Prisma seed `features` readonly mismatch

`plans` is declared with `as const`, so feature arrays were readonly tuples. Prisma expects a mutable `string[]` for `Plan.features`.

Fixed by copying the array at the Prisma boundary:

```ts
features: [...plan.features]
```

### 2. Promo reward type widened to `string`

The form parser produced `rewardType` as a string while Prisma expects `PromoRewardType`.

Fixed by validating the only two allowed values and passing the narrowed Prisma enum type to create/update operations.

### 3. Landing-page Lucide icon inference

The previous nested tuple array caused TypeScript to infer the destructured `Icon` as a union containing strings.

Fixed by defining a typed highlight registry:

```ts
Array<{ icon: LucideIcon; title: string; description: string }>
```

## Additional issues found and fixed during the full second pass

- Removed a non-async exported value from a top-level `"use server"` action module. Only async server actions remain exported there.
- Added the explicit `server-only` dependency used by server modules/tests.
- Removed an unused server-service import that could fail strict linting.
- Removed the unused `setKey` React state setter from the Writing form.
- Added `scripts/render-build.sh` and made it executable.
- Updated `render.yaml` to call the checked-in build script.
- The Render build script explicitly installs dev dependencies even with `NODE_ENV=production`, then runs Prisma generate, migration deploy and the Next.js build.
- Added `npm run verify` as a single local/release verification command.

## Environment in this container

- Node: `v22.16.0`
- npm: `10.9.2`
- Global TypeScript used only for syntax/AST checks: `5.8.3`
- `node_modules`: unavailable
- `package-lock.json`: not fabricated because dependency resolution could not complete

## Dependency-install blocker

The npm registry cannot be resolved from this runtime. Previous install/view attempts returned:

```text
EAI_AGAIN registry.npmjs.org
```

Because the project dependencies cannot be installed here, these dependency-backed commands remain **BLOCKED locally**, not passed:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Static checks that passed after the fixes

### TypeScript / TSX syntax and AST audit

Result:

```text
Files checked: 116
Syntax diagnostics: 0
Missing internal imports: 0
Invalid non-async exports from top-level "use server" files: 0
Explicit TypeScript `any` type nodes: 0
Client components importing `server-only` directly: 0
```

Generated Prisma-client imports are intentionally treated as generated targets and are produced by `prisma generate` during the real build.

Status: **PASS**

### Client/server boundary spot checks

- 7 client components were enumerated.
- No client component reads `process.env`.
- No client component directly imports database/auth/server-only modules.
- The Admin client form imports only the server-action module, which is the intended action boundary.

Status: **PASS**

### Prisma schema vs initial migration

Result:

```text
Prisma models: 21
Migration tables: 21
Prisma enums: 16
SQL enum types: 16
Missing model tables: 0
Extra tables: 0
Missing enum types: 0
Extra enum types: 0
Scalar-column mismatches: 0
```

Status: **PASS**

### Architecture guard checks

Verified statically:

- no Gemini SDK/provider-specific architecture;
- no Prisma enum for plan names;
- no exact seeded-plan branching such as `plan.slug === "pro"`;
- no production/runtime `prisma db push`;
- no `NEXT_PUBLIC_` exposure of database/OpenRouter/session secrets;
- plan and AI pipeline configuration remain data-driven.

Status: **PASS**

### Mutation origin protection

All 9 implemented API `POST` routes reference the same-origin mutation guard:

- register
- login
- logout
- Writing submit
- Vocabulary progress
- Promo redemption
- Payment order creation
- Payment transfer report
- Problem report

Status: **PASS**

## Render build path in this package

`render.yaml` calls:

```bash
bash scripts/render-build.sh
```

The script runs:

```bash
npm install --include=dev --no-audit --no-fund
npx prisma generate
npx prisma migrate deploy
npx next build
```

Start command:

```bash
npm start
```

For the first deployment to a fresh V2 database, run the seed once after migrations succeed:

```bash
npm run db:seed
```

The seed creates the initial plans/settings/starter vocabulary and does not overwrite later Admin plan edits because existing plan upserts use an empty update payload.

## Required final release verification

On Render or another environment with npm registry access, do not consider the release fully certified until all of these succeed:

```bash
npm install --include=dev
npm run db:generate
npm run typecheck
npm run lint
npm test
npm run build
```

For the fresh V2 Neon database:

```bash
npm run db:deploy
npm run db:seed
```

Do not point V2 migration testing at the old V1 production database.
