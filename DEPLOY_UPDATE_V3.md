# Skibidi IELTS v3 update

This update does not require a database migration or reseed.

## Changes

- Writing result overview card now uses a white surface; band score remains red.
- Vocabulary flashcard reverse side now uses a white surface.
- Every vocabulary word automatically has a pronunciation button powered by the browser Web Speech API. New words added by admin work immediately; there is no audio field to fill in and no audio file to upload.
- IELTS Writing grading prompt now uses a distilled scoring reference based on the supplied IELTS Writing Band Descriptors (Updated May 2023):
  - Task 1: Task Achievement, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy.
  - Task 2: Task Response, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy.
  - Server recalculates the single-task overall band from the four criterion bands and rounds to the nearest 0.5.
  - Examiner commentary remains required in Vietnamese; English corrections/sample essays remain English.
- Pricing cards returned to the original clean white-card style on both landing and dashboard. Payment-by-QR workflow remains unchanged.
- Existing plan names, prices, quotas and feature flags in Neon are not modified by this update.

## Deploy

1. Replace the current repository source with this version while keeping the existing `.git` directory.
2. Do not run `prisma:seed`.
3. Commit and push to `main`.
4. Render will auto-deploy. No SQL needs to be run in Neon for this update.

## Notes

- Old Writing submissions keep their stored feedback text. Only newly graded submissions use the updated rubric/prompt.
- Browser pronunciation voice depends on the user's OS/browser. The UI prefers an English (UK) voice when available and falls back to another English voice.
