SKIBIDI IELTS - OPENROUTER TASK 1 FILE FIX V3

Purpose
- Fix Task 1 false "We couldn't read this question" caused by legacy upload payload shapes.
- Normalize JPG/JPEG/PNG/WebP/PDF bytes before sending them to OpenRouter.
- Keep the OpenRouter pipeline capped at 3 model requests per submission.
- Keep QUESTION_IMAGE_UNREADABLE safety: genuinely unreadable visuals still fail without consuming quota.

Upload these files to the ROOT of the GitHub repository and overwrite existing files:

/src/lib/ai/gemini.ts
/src/lib/ai/openrouter-three-stage.ts
/src/lib/ai/openrouter-file-normalizer.ts

No Render environment variable changes are required if OPENROUTER_API_KEY and OPENROUTER_MODEL are already configured.

Supported upload payload shapes now include:
- Node Buffer
- Uint8Array / ArrayBuffer
- browser/server File or Blob
- { buffer, mimeType }
- multer-style { buffer, mimetype, originalname }
- { bytes, type, name }
- serialized Buffer objects
- base64 strings
- data URLs

MIME is normalized/sniffed for:
- image/jpeg
- image/png
- image/webp
- application/pdf
