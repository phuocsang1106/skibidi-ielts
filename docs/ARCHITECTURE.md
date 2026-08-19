# Skibidi IELTS V2 architecture

## Principles

- V2 is a clean implementation. It does not contain compatibility wrappers for the previous Gemini-specific architecture.
- PostgreSQL is the source of truth for plans, commercial entitlements, operational AI configuration, payments, promo rules, vocabulary content and audit history.
- Plan names are ordinary database records. No TypeScript enum or `if (plan === "PRO")` gate exists.
- OpenRouter is the only AI provider boundary. Individual model IDs are plan/stage configuration.
- Commercial configuration is snapshotted into `Subscription` and `PaymentOrder`; operational model/pipeline configuration is intentionally read live for future submissions.
- A Writing credit is consumed only inside the same successful database transaction that persists the submission/result.

## Main boundaries

```text
Browser / Next.js App Router
        |
        +-- Public pages / Auth route handlers
        +-- Authenticated Server Components
        +-- Mutation route handlers + Server Actions
        |
Service layer
        +-- subscriptions / entitlements
        +-- credits / ledger
        +-- plans
        +-- payments
        +-- promo
        +-- vocabulary
        +-- Writing orchestration
        |
AI layer
        +-- OpenRouter client
        +-- runtime pipeline resolver
        +-- Task 1 multimodal stages
        +-- Task 2 stages
        +-- Zod structured-output validation
        +-- safe AI call logging
        |
Prisma 7 + @prisma/adapter-pg
        |
Neon PostgreSQL
```

## Writing success boundary

1. Authenticate user.
2. Preflight available plan/bonus credit.
3. Validate task type, question, essay and file constraints.
4. Resolve the user's active subscription and the current operational `Plan`/`PlanAIConfig`.
5. Execute the required 1–4 OpenRouter stages.
6. Validate each structured result with Zod.
7. For Task 1, distinguish a real visual-readability failure from provider/model/format failures.
8. Begin a serializable persistence transaction.
9. Persist `WritingSubmission`, `WritingResult` and four criterion rows.
10. Consume exactly one plan credit, or bonus credit if the plan bucket is empty.
11. Commit.

No AI-stage failure can reach step 8. A database failure rolls back both the result and the credit mutation.

## Task 2 pipelines

- 1: all-in-one examiner + feedback.
- 2: examiner, then verifier + feedback.
- 3: examiner, independent verifier, feedback.
- 4: examiner, independent verifier, teaching/error analysis, final feedback.

## Task 1 pipelines

- 1: multimodal all-in-one extraction + grading + feedback.
- 2: multimodal extraction, then grade + feedback.
- 3: extraction, examiner, verifier + feedback.
- 4: extraction, examiner, independent verifier, feedback.

The verifier is permitted to raise or lower criterion bands. After verification, the locked examiner object is passed to later stages. Feedback schemas contain no score fields.

## Entitlement model

`Plan` is editable. A purchase or grant creates a `Subscription` snapshot containing plan name, price paid, duration, submission limit and features. Later plan edits do not rewrite existing commercial entitlements. `PlanAIConfig` remains live operational configuration, allowing model and pipeline changes without a redeploy.

`SubmissionCreditLedger` records plan/bonus grants and consumption. Consumption order is plan first, then bonus.

## Historical deletion policy

Plans without references can be physically deleted. Referenced plans are archived and retained. Hidden plans disappear from new purchase surfaces but remain valid for existing subscriptions.
