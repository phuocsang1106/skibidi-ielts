Why Render failed
=================
The existing writing/service.ts still uses the legacy GeminiGradingProvider API.
The first OpenRouter patch changed the provider shape without fully preserving
that legacy interface.

What V2 changes
===============
1. Adds extractInputs() as a local normalization method (0 AI requests).
2. Adds generateProEnhancements() as a result-unwrapping method (0 AI requests).
3. Exposes the four criterion objects both at top level and under result.criteria.
4. Keeps the actual grading pipeline at three OpenRouter model requests.

No UI, payment, vocabulary, database schema, or quota code is changed.
