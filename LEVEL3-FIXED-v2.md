# Level 3 backend v2

Fixes the Render type-check failures introduced by the first Level 3 patch:

- Admin Vocabulary now accepts LEVEL_3.
- Prisma schema restores the AiRateLimit model used by Writing rate limiting.
- Keeps the Level 3 enum, seed, service and Render build integration.
- Existing Level 1/2 data is preserved.
