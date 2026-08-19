# Skibidi IELTS v4 - Vocabulary band library

## What this update adds

- 3 IELTS vocabulary learning groups.
- 15 main topics + 7 supplementary topics in each group.
- 300 unique headwords/phrases per group, 900 total.
- English meanings, Vietnamese explanations, examples and synonyms.
- Main/subtopic separation in the learner UI and admin CMS.
- Existing browser-generated pronunciation works automatically for all new entries.
- `VocabularyTopic.isSupplementary` added to Prisma.

## Safe database behaviour

Migration `0003_vocab_band_library` is additive and idempotent inside the migration itself:

- adds `isSupplementary` with a safe default;
- reuses the original `Academic Vocabulary` group as Group 2 when present;
- reuses/renames the original `Environment` topic to `Environment & Energy` when present;
- updates the three original seed entries in place when they already exist;
- inserts the new topics and words without deleting users, plans, writing history, payment requests or custom account data.

Do not run `prisma:seed` for this deployment.

## Deploy

1. Replace the current repository files with this source while keeping `.git` and local secrets.
2. Commit and push to `main`.
3. Render's existing build command runs `npx prisma migrate deploy`, so migration `0003_vocab_band_library` imports the library automatically.
4. No manual Neon SQL is required.

After deploy, open Vocabulary and confirm three groups are visible. Each group should show 15 main topics and 7 supplementary topics.
