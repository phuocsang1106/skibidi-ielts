# Vocabulary QA Report — v5

## Final counts

- Total: **2,500 unique headwords/phrases**
- Group 1: **700**
- Group 2: **850**
- Group 3: **950**
- Topics: **66** (15 main + 7 supplementary per group)
- Duplicate normalized headwords across the whole library: **0**

## Form balance

- Group 1: 377 single words / 323 phrases or collocations
- Group 2: 113 single words / 737 phrases or collocations
- Group 3: 72 single words / 878 phrases or collocations

This progression is intentional: lower tiers establish high-frequency core vocabulary, while higher tiers increasingly teach collocation, paraphrase and precise multiword language rather than rare isolated words.

## Four-skill QA intent

- **Reading:** academic/social-science/science terms, paraphrase recognition and domain vocabulary.
- **Listening:** everyday services, schedules, education/work language, academic discussion and lecture vocabulary.
- **Speaking:** natural collocations, familiar-topic language, flexible paraphrases and Part 3 discussion vocabulary.
- **Writing:** precise topic vocabulary, collocations, policy/economic/environmental language and reusable academic phrasing.

## Automated checks passed

`npm run vocab:validate`

- exact group counts;
- exact total of 2,500;
- 12-17 main topic constraint;
- 5-10 supplementary topic constraint;
- duplicate rejection;
- regeneration of the JSON library and migration 0004.

`npm run vocab:audit`

- required learner-facing fields;
- global duplicate check;
- topic distribution;
- example-sentence punctuation;
- basic field-length sanity checks.

## TypeScript validation note

All 97 TS/TSX files pass syntax transpilation with TypeScript 5.8.3. A full `tsc --noEmit` cannot complete in this artifact environment because the uploaded source does not include `node_modules` and npm dependency installation timed out; the reported errors are missing external modules/type declarations such as Next.js, React, Prisma and Node types. Render/GitHub CI installs these dependencies before its normal typecheck/build.
