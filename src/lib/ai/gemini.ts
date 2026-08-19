/**
 * Compatibility entrypoint for the legacy Skibidi IELTS writing service.
 *
 * The existing service imports GeminiGradingProvider from this path and still
 * calls several methods from the old Gemini implementation.  Keep those
 * methods available while routing the real grading work through OpenRouter.
 *
 * IMPORTANT: extractInputs() and generateProEnhancements() below do not make
 * additional AI calls.  The actual model pipeline remains capped at three
 * OpenRouter requests per submission.
 */
import { gradeWritingThreeStage, type ThreeStageInput } from "./openrouter-three-stage";

export { gradeWritingThreeStage } from "./openrouter-three-stage";
export type { ThreeStageInput } from "./openrouter-three-stage";

function pickQuestionFile(first: any) {
  return (
    first?.questionFile ??
    first?.questionUpload ??
    first?.questionImage ??
    first?.visualFile ??
    undefined
  );
}

function normalizeArgs(args: any[]): ThreeStageInput {
  const first = args[0] ?? {};

  if (
    first &&
    typeof first === "object" &&
    (first.taskType ||
      first.essayText ||
      first.essay ||
      first.questionText ||
      first.question)
  ) {
    return {
      taskType: first.taskType === "TASK_1" ? "TASK_1" : "TASK_2",
      questionText: first.questionText ?? first.question ?? "",
      essayText: first.essayText ?? first.essay ?? first.responseText ?? "",
      plan:
        first.plan === "PRO" ||
        first.entitlementPlan === "PRO" ||
        first.isPro === true
          ? "PRO"
          : "FREE",
      questionFile: pickQuestionFile(first),
    };
  }

  return {
    taskType: args[0] === "TASK_1" ? "TASK_1" : "TASK_2",
    questionText: typeof args[1] === "string" ? args[1] : "",
    essayText: typeof args[2] === "string" ? args[2] : "",
    plan: args[3] === "PRO" ? "PRO" : "FREE",
  };
}

function findGradingResult(value: any): any | null {
  if (!value || typeof value !== "object") return null;

  if (
    "estimatedOverallBand" in value ||
    "improvedEssay" in value ||
    "detailedCriterionAnalysis" in value ||
    "nextBandGuidance" in value
  ) {
    return value;
  }

  for (const key of ["result", "gradingResult", "grade", "evaluation"]) {
    if (value[key] && typeof value[key] === "object") {
      const nested = findGradingResult(value[key]);
      if (nested) return nested;
    }
  }

  return null;
}

export class GeminiGradingProvider {
  readonly name = "openrouter";
  readonly model = process.env.OPENROUTER_MODEL || "google/gemini-3.7-flash";

  /**
   * Legacy preprocessing hook.
   *
   * This intentionally performs NO network request.  It simply normalizes the
   * old service payload into the input expected by the new three-stage
   * pipeline.  Task 1 visual extraction is performed inside
   * gradeWritingThreeStage(), so the total remains three model requests.
   */
  async extractInputs(...args: any[]): Promise<any> {
    const input = normalizeArgs(args);

    return {
      ...input,
      // Old call sites sometimes use these aliases.
      question: input.questionText ?? "",
      essay: input.essayText,
      responseText: input.essayText,
    };
  }

  async evaluateWriting(...args: any[]): Promise<any> {
    return gradeWritingThreeStage(normalizeArgs(args));
  }

  async gradeWriting(...args: any[]): Promise<any> {
    return this.evaluateWriting(...args);
  }

  async evaluate(...args: any[]): Promise<any> {
    return this.evaluateWriting(...args);
  }

  async gradeEssay(...args: any[]): Promise<any> {
    return this.evaluateWriting(...args);
  }

  /**
   * The new pipeline already contains the independent verifier.  Keep this
   * method only for legacy callers and never trigger another model call when a
   * finished result is supplied.
   */
  async verifyGrade(resultOrInput: any, ...rest: any[]): Promise<any> {
    const existing = findGradingResult(resultOrInput);
    if (existing) return existing;
    return this.evaluateWriting(resultOrInput, ...rest);
  }

  async generateBand7Sample(resultOrInput: any, ...rest: any[]): Promise<string> {
    const existing = findGradingResult(resultOrInput);
    if (existing && typeof existing.band7Sample === "string") {
      return existing.band7Sample;
    }

    const result = await this.evaluateWriting(resultOrInput, ...rest);
    return result.band7Sample ?? "";
  }

  /**
   * Legacy Pro hook.  Request 3 of the new pipeline already creates these
   * fields, so this method only unwraps them.  It does NOT call OpenRouter.
   */
  async generateProEnhancements(...args: any[]): Promise<any> {
    for (const arg of args) {
      const result = findGradingResult(arg);
      if (result) {
        return {
          detailedCriterionAnalysis: result.detailedCriterionAnalysis ?? null,
          improvedEssay: result.improvedEssay ?? null,
          nextBandGuidance: result.nextBandGuidance ?? null,
        };
      }
    }

    // Safe compatibility fallback.  Never create a fourth model request.
    return {
      detailedCriterionAnalysis: null,
      improvedEssay: null,
      nextBandGuidance: null,
    };
  }

  async generateProFeedback(...args: any[]): Promise<any> {
    return this.generateProEnhancements(...args);
  }

  async extractQuestion(input: any): Promise<any> {
    if (typeof input === "string") return input;
    return input?.questionText ?? input?.question ?? input;
  }

  async extractEssay(input: any): Promise<any> {
    if (typeof input === "string") return input;
    return input?.essayText ?? input?.essay ?? input?.responseText ?? input;
  }
}

export class OpenRouterGradingProvider extends GeminiGradingProvider {}

export const gradingProvider = new GeminiGradingProvider();
export const geminiProvider = gradingProvider;
export const openRouterProvider = gradingProvider;
export const createGeminiProvider = () => new GeminiGradingProvider();
export const createOpenRouterProvider = () => new OpenRouterGradingProvider();
export const getGeminiProvider = () => gradingProvider;
export const createGradingProvider = createOpenRouterProvider;

export default GeminiGradingProvider;
