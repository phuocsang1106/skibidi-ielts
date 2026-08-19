-- Skibidi IELTS V2 initial schema. Safe for a fresh V2 database/schema only.
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "PlanVisibility" AS ENUM ('PUBLIC', 'HIDDEN', 'ARCHIVED');
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'QUEUED', 'EXPIRED', 'CANCELLED');
CREATE TYPE "SubscriptionSource" AS ENUM ('PURCHASE', 'PROMO', 'ADMIN', 'FREE');
CREATE TYPE "PromoRewardType" AS ENUM ('GRANT_PLAN', 'ADD_SUBMISSIONS');
CREATE TYPE "PromoActivationBehavior" AS ENUM ('ACTIVATE_NOW', 'QUEUE_AFTER_CURRENT');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'TRANSFER_REPORTED', 'APPROVED', 'REJECTED', 'EXPIRED');
CREATE TYPE "WritingTaskType" AS ENUM ('TASK_1', 'TASK_2');
CREATE TYPE "WritingSubmissionStatus" AS ENUM ('SUCCEEDED', 'FAILED');
CREATE TYPE "VocabularyProgressStatus" AS ENUM ('NOT_STARTED', 'LEARNING', 'LEARNED');
CREATE TYPE "ProblemReportCategory" AS ENUM ('SCORE_TOO_HIGH', 'SCORE_TOO_LOW', 'FEEDBACK_INCORRECT', 'QUESTION_MISUNDERSTOOD', 'TASK1_IMAGE_MISUNDERSTOOD', 'OTHER');
CREATE TYPE "ProblemReportStatus" AS ENUM ('OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED');
CREATE TYPE "CreditBucket" AS ENUM ('PLAN', 'BONUS');
CREATE TYPE "CreditLedgerKind" AS ENUM ('GRANT', 'CONSUME', 'ADJUST');
CREATE TYPE "AiCallStatus" AS ENUM ('SUCCESS', 'FAILURE');
CREATE TYPE "AiErrorCategory" AS ENUM ('FILE_INVALID', 'UNSUPPORTED_FILE', 'PROVIDER_ERROR', 'MODEL_ERROR', 'STRUCTURED_OUTPUT_ERROR', 'QUESTION_ACTUALLY_UNREADABLE', 'TIMEOUT', 'VALIDATION_ERROR', 'UNKNOWN');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "username" TEXT NOT NULL,
  "normalizedUsername" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'USER',
  "bonusSubmissionBalance" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
  "id" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LoginRateLimit" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "key" TEXT NOT NULL,
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "blockedUntil" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LoginRateLimit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Plan" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "priceVnd" INTEGER NOT NULL,
  "durationDays" INTEGER,
  "submissionLimit" INTEGER NOT NULL,
  "features" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "visibility" "PlanVisibility" NOT NULL DEFAULT 'PUBLIC',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "badge" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "aiRequestsPerSubmission" INTEGER NOT NULL DEFAULT 1,
  "defaultModel" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlanAIConfig" (
  "id" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "task1VisionModel" TEXT,
  "task1ExaminerModel" TEXT,
  "task1VerifierModel" TEXT,
  "task1FeedbackModel" TEXT,
  "task2ExaminerModel" TEXT,
  "task2VerifierModel" TEXT,
  "task2FeedbackModel" TEXT,
  "task2TeachingModel" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlanAIConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Subscription" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
  "source" "SubscriptionSource" NOT NULL,
  "sourceReferenceId" TEXT,
  "planNameSnapshot" TEXT NOT NULL,
  "pricePaidVnd" INTEGER NOT NULL,
  "durationDaysSnapshot" INTEGER,
  "submissionLimitSnapshot" INTEGER NOT NULL,
  "featureSnapshot" TEXT[] NOT NULL,
  "remainingPlanSubmissions" INTEGER NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PromoCode" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "rewardType" "PromoRewardType" NOT NULL,
  "grantPlanId" TEXT,
  "grantDurationDays" INTEGER,
  "addSubmissions" INTEGER,
  "maxTotalRedemptions" INTEGER,
  "redemptionLimitPerUser" INTEGER NOT NULL DEFAULT 1,
  "expiresAt" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "activationBehavior" "PromoActivationBehavior" NOT NULL DEFAULT 'QUEUE_AFTER_CURRENT',
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PromoRedemption" (
  "id" TEXT NOT NULL,
  "promoCodeId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "ordinal" INTEGER NOT NULL,
  "rewardJson" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PromoRedemption_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaymentOrder" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "amountVnd" INTEGER NOT NULL,
  "transferCode" TEXT NOT NULL,
  "planNameSnapshot" TEXT NOT NULL,
  "durationDaysSnapshot" INTEGER,
  "submissionLimitSnapshot" INTEGER NOT NULL,
  "featureSnapshot" TEXT[] NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "transferReportedAt" TIMESTAMP(3),
  "approvedAt" TIMESTAMP(3),
  "approvedByAdminId" TEXT,
  "rejectedAt" TIMESTAMP(3),
  "rejectedByAdminId" TEXT,
  "rejectionReason" TEXT,
  CONSTRAINT "PaymentOrder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WritingSubmission" (
  "id" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "planNameSnapshot" TEXT NOT NULL,
  "featureSnapshot" TEXT[] NOT NULL,
  "taskType" "WritingTaskType" NOT NULL,
  "status" "WritingSubmissionStatus" NOT NULL DEFAULT 'SUCCEEDED',
  "questionText" TEXT,
  "questionTitle" TEXT NOT NULL,
  "normalizedQuestion" JSONB,
  "essayText" TEXT NOT NULL,
  "wordCount" INTEGER NOT NULL,
  "pipelineSize" INTEGER NOT NULL,
  "rubricVersion" TEXT NOT NULL,
  "promptVersion" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WritingSubmission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WritingResult" (
  "id" TEXT NOT NULL,
  "submissionId" TEXT NOT NULL,
  "overallBand" DECIMAL(2,1) NOT NULL,
  "mainIssue" TEXT NOT NULL,
  "errors" JSONB NOT NULL,
  "sentenceImprovements" JSONB NOT NULL,
  "priorityImprovements" JSONB NOT NULL,
  "band7Sample" TEXT NOT NULL,
  "improvedEssay" TEXT,
  "detailedCriterionAnalysis" JSONB,
  "nextBandGuidance" JSONB,
  "verifierMetadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WritingResult_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WritingCriterionResult" (
  "id" TEXT NOT NULL,
  "writingResultId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "band" DECIMAL(2,1) NOT NULL,
  "summary" TEXT NOT NULL,
  "evidence" JSONB NOT NULL,
  "limitingWeaknesses" JSONB NOT NULL,
  CONSTRAINT "WritingCriterionResult_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiCallLog" (
  "id" TEXT NOT NULL,
  "logicalSubmissionId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "stage" TEXT NOT NULL,
  "pipelineSize" INTEGER NOT NULL,
  "model" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL,
  "latencyMs" INTEGER NOT NULL,
  "providerStatus" INTEGER,
  "status" "AiCallStatus" NOT NULL,
  "inputTokens" INTEGER,
  "outputTokens" INTEGER,
  "totalTokens" INTEGER,
  "costUsd" DECIMAL(12,6),
  "errorCategory" "AiErrorCategory",
  "errorCode" TEXT,
  "sanitizedError" TEXT,
  "promptVersion" TEXT NOT NULL,
  "rubricVersion" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AiCallLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SubmissionCreditLedger" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "subscriptionId" TEXT,
  "submissionId" TEXT,
  "bucket" "CreditBucket" NOT NULL,
  "kind" "CreditLedgerKind" NOT NULL,
  "delta" INTEGER NOT NULL,
  "balanceAfter" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "sourceReferenceId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SubmissionCreditLedger_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VocabularyLevel" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "bandRange" TEXT NOT NULL,
  "description" TEXT,
  "requiredFeature" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VocabularyLevel_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VocabularyTopic" (
  "id" TEXT NOT NULL,
  "levelId" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "requiredFeature" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VocabularyTopic_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VocabularyWord" (
  "id" TEXT NOT NULL,
  "topicId" TEXT NOT NULL,
  "word" TEXT NOT NULL,
  "ipa" TEXT,
  "partOfSpeech" TEXT NOT NULL,
  "vietnameseMeaning" TEXT NOT NULL,
  "collocations" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "synonyms" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "exampleSentence" TEXT NOT NULL,
  "usageNote" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VocabularyWord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserVocabularyProgress" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "wordId" TEXT NOT NULL,
  "status" "VocabularyProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserVocabularyProgress_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProblemReport" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "submissionId" TEXT NOT NULL,
  "category" "ProblemReportCategory" NOT NULL,
  "message" TEXT,
  "status" "ProblemReportStatus" NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProblemReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminAuditLog" (
  "id" TEXT NOT NULL,
  "adminId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "beforeJson" JSONB,
  "afterJson" JSONB,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AppSetting" (
  "key" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("key")
);

CREATE UNIQUE INDEX "User_normalizedUsername_key" ON "User"("normalizedUsername");
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");
CREATE UNIQUE INDEX "LoginRateLimit_key_key" ON "LoginRateLimit"("key");
CREATE UNIQUE INDEX "Plan_slug_key" ON "Plan"("slug");
CREATE INDEX "Plan_visibility_isActive_sortOrder_idx" ON "Plan"("visibility", "isActive", "sortOrder");
CREATE UNIQUE INDEX "PlanAIConfig_planId_key" ON "PlanAIConfig"("planId");
CREATE INDEX "Subscription_userId_status_startsAt_idx" ON "Subscription"("userId", "status", "startsAt");
CREATE INDEX "Subscription_expiresAt_idx" ON "Subscription"("expiresAt");
CREATE INDEX "Subscription_planId_idx" ON "Subscription"("planId");
CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");
CREATE INDEX "PromoCode_isActive_expiresAt_idx" ON "PromoCode"("isActive", "expiresAt");
CREATE UNIQUE INDEX "PromoRedemption_promoCodeId_userId_ordinal_key" ON "PromoRedemption"("promoCodeId", "userId", "ordinal");
CREATE INDEX "PromoRedemption_promoCodeId_createdAt_idx" ON "PromoRedemption"("promoCodeId", "createdAt");
CREATE INDEX "PromoRedemption_userId_createdAt_idx" ON "PromoRedemption"("userId", "createdAt");
CREATE UNIQUE INDEX "PaymentOrder_transferCode_key" ON "PaymentOrder"("transferCode");
CREATE INDEX "PaymentOrder_status_createdAt_idx" ON "PaymentOrder"("status", "createdAt");
CREATE INDEX "PaymentOrder_userId_createdAt_idx" ON "PaymentOrder"("userId", "createdAt");
CREATE UNIQUE INDEX "WritingSubmission_userId_idempotencyKey_key" ON "WritingSubmission"("userId", "idempotencyKey");
CREATE INDEX "WritingSubmission_userId_createdAt_idx" ON "WritingSubmission"("userId", "createdAt");
CREATE INDEX "WritingSubmission_planId_createdAt_idx" ON "WritingSubmission"("planId", "createdAt");
CREATE INDEX "WritingSubmission_taskType_createdAt_idx" ON "WritingSubmission"("taskType", "createdAt");
CREATE UNIQUE INDEX "WritingResult_submissionId_key" ON "WritingResult"("submissionId");
CREATE UNIQUE INDEX "WritingCriterionResult_writingResultId_key_key" ON "WritingCriterionResult"("writingResultId", "key");
CREATE INDEX "AiCallLog_logicalSubmissionId_startedAt_idx" ON "AiCallLog"("logicalSubmissionId", "startedAt");
CREATE INDEX "AiCallLog_status_createdAt_idx" ON "AiCallLog"("status", "createdAt");
CREATE INDEX "AiCallLog_model_createdAt_idx" ON "AiCallLog"("model", "createdAt");
CREATE UNIQUE INDEX "SubmissionCreditLedger_submissionId_key" ON "SubmissionCreditLedger"("submissionId");
CREATE INDEX "SubmissionCreditLedger_userId_createdAt_idx" ON "SubmissionCreditLedger"("userId", "createdAt");
CREATE INDEX "SubmissionCreditLedger_subscriptionId_createdAt_idx" ON "SubmissionCreditLedger"("subscriptionId", "createdAt");
CREATE UNIQUE INDEX "VocabularyLevel_slug_key" ON "VocabularyLevel"("slug");
CREATE INDEX "VocabularyLevel_isActive_sortOrder_idx" ON "VocabularyLevel"("isActive", "sortOrder");
CREATE UNIQUE INDEX "VocabularyTopic_levelId_slug_key" ON "VocabularyTopic"("levelId", "slug");
CREATE INDEX "VocabularyTopic_levelId_isActive_sortOrder_idx" ON "VocabularyTopic"("levelId", "isActive", "sortOrder");
CREATE UNIQUE INDEX "VocabularyWord_topicId_word_key" ON "VocabularyWord"("topicId", "word");
CREATE INDEX "VocabularyWord_topicId_isActive_sortOrder_idx" ON "VocabularyWord"("topicId", "isActive", "sortOrder");
CREATE UNIQUE INDEX "UserVocabularyProgress_userId_wordId_key" ON "UserVocabularyProgress"("userId", "wordId");
CREATE INDEX "UserVocabularyProgress_userId_status_idx" ON "UserVocabularyProgress"("userId", "status");
CREATE INDEX "ProblemReport_status_createdAt_idx" ON "ProblemReport"("status", "createdAt");
CREATE INDEX "ProblemReport_submissionId_idx" ON "ProblemReport"("submissionId");
CREATE INDEX "AdminAuditLog_adminId_createdAt_idx" ON "AdminAuditLog"("adminId", "createdAt");
CREATE INDEX "AdminAuditLog_entityType_entityId_createdAt_idx" ON "AdminAuditLog"("entityType", "entityId", "createdAt");

ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LoginRateLimit" ADD CONSTRAINT "LoginRateLimit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlanAIConfig" ADD CONSTRAINT "PlanAIConfig_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PromoCode" ADD CONSTRAINT "PromoCode_grantPlanId_fkey" FOREIGN KEY ("grantPlanId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PromoRedemption" ADD CONSTRAINT "PromoRedemption_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PromoRedemption" ADD CONSTRAINT "PromoRedemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentOrder" ADD CONSTRAINT "PaymentOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentOrder" ADD CONSTRAINT "PaymentOrder_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentOrder" ADD CONSTRAINT "PaymentOrder_approvedByAdminId_fkey" FOREIGN KEY ("approvedByAdminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentOrder" ADD CONSTRAINT "PaymentOrder_rejectedByAdminId_fkey" FOREIGN KEY ("rejectedByAdminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WritingSubmission" ADD CONSTRAINT "WritingSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WritingSubmission" ADD CONSTRAINT "WritingSubmission_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WritingResult" ADD CONSTRAINT "WritingResult_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "WritingSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WritingCriterionResult" ADD CONSTRAINT "WritingCriterionResult_writingResultId_fkey" FOREIGN KEY ("writingResultId") REFERENCES "WritingResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiCallLog" ADD CONSTRAINT "AiCallLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AiCallLog" ADD CONSTRAINT "AiCallLog_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SubmissionCreditLedger" ADD CONSTRAINT "SubmissionCreditLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SubmissionCreditLedger" ADD CONSTRAINT "SubmissionCreditLedger_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SubmissionCreditLedger" ADD CONSTRAINT "SubmissionCreditLedger_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "WritingSubmission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VocabularyTopic" ADD CONSTRAINT "VocabularyTopic_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "VocabularyLevel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VocabularyWord" ADD CONSTRAINT "VocabularyWord_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "VocabularyTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserVocabularyProgress" ADD CONSTRAINT "UserVocabularyProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserVocabularyProgress" ADD CONSTRAINT "UserVocabularyProgress_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "VocabularyWord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProblemReport" ADD CONSTRAINT "ProblemReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProblemReport" ADD CONSTRAINT "ProblemReport_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "WritingSubmission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
