# Skibidi IELTS v5 — 2,500-item Four-Skill Vocabulary Library

## What changes

- Vocabulary grows from 900 to **2,500 unique entries**.
- Group totals become **700 / 850 / 950**.
- The existing 15 main + 7 supplementary topics per group remain unchanged.
- The extra 1,600 entries are balanced for Reading, Listening, Speaking and Writing rather than Writing-only preparation.
- Browser pronunciation continues to work automatically for every new word/phrase.
- No user, plan, payment, promo or Writing History data is changed.

## Migration safety

This release adds a new migration:

`prisma/migrations/0004_vocab_four_skill_expansion/migration.sql`

Do **not** edit or replace the already-deployed `0003_vocab_band_library` migration. The new migration only upserts the additional vocabulary rows into the topics created by v4.

## Deploy

1. Replace the current repository source with this version while preserving `.git`.
2. Do not run `prisma:seed`.
3. Commit and push to `main`.
4. Render runs `npx prisma migrate deploy` from the existing build command.
5. Open Vocabulary after deploy and verify the three totals: 700 / 850 / 950.

No manual Neon SQL is required.

## Local QA

```bash
npm run vocab:validate
npm run vocab:audit
npm run typecheck
npm test
```

The two vocabulary checks do not require a database connection.
