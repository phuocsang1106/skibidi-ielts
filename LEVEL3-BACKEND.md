# Skibidi IELTS — Level 3 backend patch

This patch adds a real `LEVEL_3` vocabulary level to PostgreSQL/Prisma without deleting Level 1 or Level 2 data.

## What it changes

- Adds `LEVEL_3` to `VocabularyLevel`.
- Adds a safe PostgreSQL enum migration.
- Extends vocabulary progress/service APIs to Level 3.
- Seeds 18 Level 3 topics (12 core + 6 additional).
- Seeds a small curated Level 3 starter set with globally unique lemmas.
- Keeps Level 1, Level 2 and Level 3 progress independent because progress remains keyed by vocabulary item.
- Updates Render build so Level 3 seed is applied automatically and idempotently.

## Deployment order

Upload these files to the repository root, commit to `main`, and let Render redeploy.
Do not manually delete or recreate the Neon database.

The seed is intentionally a starter dataset. Expanding Level 3 to the final 35–75 words per topic should be done as a separate content patch after the schema/backend is live.
