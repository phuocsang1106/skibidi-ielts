# Skibidi IELTS — OpenRouter 3-request grading patch

## Render environment variables

Add these in Render > Environment:

```text
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=google/gemini-3.7-flash
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
APP_URL=https://skibidi-ielts.onrender.com
```

Do NOT commit a real API key to GitHub.

Keep the old GEMINI_API_KEY temporarily until the OpenRouter path has been tested.

## Intended request count

Task 2:
1. Examiner
2. Independent verifier
3. Feedback generator with locked scores

Task 1 with visual question + typed/TXT/DOCX essay:
1. Visual question extraction
2. Examiner
3. Verifier + feedback

If the user's essay itself is an image/PDF that still requires a separate AI OCR call in your existing upload layer, that extraction can add another model request. The patch does not silently remove that functionality.

## IELTS rubric

The prompt rubric in `src/lib/ai/ielts-rubric-2023.ts` is a concise paraphrase of the IELTS Writing Band Descriptors, Updated May 2023. It keeps Task 1 Task Achievement and Task 2 Task Response separate and scores CC/LR/GRA independently.

## Integration note

This patch provides `GeminiGradingProvider`, `OpenRouterGradingProvider`, `gradingProvider`, `getGradingProvider`, `evaluateWriting`, and `gradeWriting` compatibility entrypoints. If your current Writing service imports one of these central provider entrypoints, uploading the patch should route it through OpenRouter.

If your current `src/lib/writing/service.ts` calls old low-level methods such as `extractQuestion()`, `gradeEssay()`, `verifyGrade()`, `generateBand7Sample()` individually, update that service to call:

```ts
import { gradeWritingThreeStage } from "@/lib/ai/openrouter-three-stage";

const result = await gradeWritingThreeStage({
  taskType,
  questionText,
  essayText,
  plan: entitlement.plan === "PRO" ? "PRO" : "FREE",
  questionFile,
});
```

Keep quota consumption AFTER this call succeeds and AFTER the result is persisted.
