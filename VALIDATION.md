# Validation report

Validation date: 2026-08-19

## Release status

**Production build is not certified in this container.** The source package is implemented, but dependency installation cannot complete because this runtime cannot resolve `registry.npmjs.org`. Per the project definition of done, the application must not be called fully complete until the real dependency-backed typecheck, lint, test suite and Next.js production build pass.

## Environment

- Node: `v22.16.0`
- npm: `10.9.2`
- Global TypeScript used only for syntax transpilation: `5.8.3`
- `node_modules`: not available
- `package-lock.json`: not generated because npm registry access is unavailable

## Registry/dependency check

Command:

```bash
npm view next version --fetch-timeout=10000 --fetch-retries=0
```

Result: **BLOCKED**

```text
npm error code EAI_AGAIN
npm error syscall getaddrinfo
npm error request to https://registry.npmjs.org/next failed, reason: getaddrinfo EAI_AGAIN registry.npmjs.org
```

An earlier dependency install attempt also timed out for the same environment-level network limitation.

## Required project commands

These commands were invoked after the registry failure to record their exact local status:

| Command | Result | Reason |
|---|---|---|
| `npm run typecheck` | BLOCKED, exit 127 | local Prisma CLI unavailable because dependencies could not be installed |
| `npm run lint` | BLOCKED, exit 127 | local ESLint unavailable because dependencies could not be installed |
| `npm test` | BLOCKED, exit 127 | local Prisma/Vitest unavailable because dependencies could not be installed |
| `npm run build` | BLOCKED, exit 127 | local Prisma/Next CLI unavailable because dependencies could not be installed |

Representative output:

```text
> skibidi-ielts-v2@2.0.0 typecheck
> prisma generate && tsc --noEmit
sh: 1: prisma: not found

> skibidi-ielts-v2@2.0.0 lint
> eslint . --max-warnings=0
sh: 1: eslint: not found

> skibidi-ielts-v2@2.0.0 test
> prisma generate && vitest run
sh: 1: prisma: not found

> skibidi-ielts-v2@2.0.0 build
> prisma generate && next build
sh: 1: prisma: not found
```

## Checks that did run successfully

### TypeScript/TSX syntax transpilation

The global TypeScript compiler API was used only as a parser/transpiler, without pretending that external module or Prisma-generated types were available.

Result:

```text
Checked 112 TS/TSX files; syntax diagnostics: 0
```

Status: **PASS**

### Internal import resolution

All relative and `@/` imports were checked against the source tree. Generated Prisma-client imports were explicitly excluded because `prisma generate` cannot run without installed dependencies.

Result:

```text
Internal import references checked: 112
Expected generated Prisma client references ignored until prisma generate.
Missing internal imports: 0
```

Status: **PASS**

### Prisma schema/migration structural consistency

Custom static checks compared Prisma model names/scalar columns with `prisma/migrations/0001_init/migration.sql`.

Result:

```text
Prisma models: 21
Migration tables: 21
Missing model tables: []
Extra tables: []
Scalar column schema/migration consistency: PASS
```

Status: **PASS**

### Architecture guard scans

Static scans checked the requested architectural invariants:

- no Gemini SDK/provider architecture;
- no Prisma enum named `Plan`;
- no branching on exact seeded plan names (`FREE`, `PLUS`, `PRO`, `MAX`, `ULTRA`) in application source;
- no production/runtime `prisma db push` command;
- no `NEXT_PUBLIC_*` exposure for database/OpenRouter/session secrets.

Result: **PASS**

### Mutation origin protection scan

Every implemented `POST` route under `src/app/api` invokes the same-origin mutation guard:

- auth register/login/logout
- Writing submit
- vocabulary progress
- promo redemption
- payment create/report
- problem reports

Status: **PASS**

### Supplied rubric retention

The PDF copied to `docs/ielts_writing_band_descriptors_may_2023.pdf` has the same SHA-256 as the supplied attachment:

```text
c5955e7155345287ef2ad4e45165d7561fdcefe7eec037ce71e42c1caf8afa43
```

Status: **PASS**

## Required release verification in a networked environment

Run these commands before deployment and do not mark the release complete unless all succeed:

```bash
npm install
npm run db:generate
npm run typecheck
npm run lint
npm test
npm run build
```

Then run migrations against a fresh/disposable V2 database before first production deployment:

```bash
npm run db:deploy
npm run db:seed
```

Do not point V2 verification or migration testing at the existing V1 production database.
