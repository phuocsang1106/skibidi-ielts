/**
 * Compatibility entrypoint.
 *
 * Existing Skibidi IELTS code originally imported its AI implementation from
 * lib/ai/gemini.ts. Keep that path stable while routing new grading through
 * OpenRouter + Gemini 3.7 Flash.
 */
import { gradeWritingThreeStage, type ThreeStageInput } from "./openrouter-three-stage";

export { gradeWritingThreeStage } from "./openrouter-three-stage";
export type { ThreeStageInput } from "./openrouter-three-stage";

function normalizeArgs(args: any[]): ThreeStageInput {
  const first = args[0] ?? {};
  if (first && typeof first === "object" && (first.taskType || first.essayText || first.essay)) {
    return {
      taskType: first.taskType === "TASK_1" ? "TASK_1" : "TASK_2",
      questionText: first.questionText ?? first.question ?? "",
      essayText: first.essayText ?? first.essay ?? "",
      plan: first.plan === "PRO" || first.entitlementPlan === "PRO" ? "PRO" : "FREE",
      questionFile: first.questionFile,
    };
  }
  return {
    taskType: args[0] === "TASK_1" ? "TASK_1" : "TASK_2",
    questionText: typeof args[1] === "string" ? args[1] : "",
    essayText: typeof args[2] === "string" ? args[2] : "",
    plan: args[3] === "PRO" ? "PRO" : "FREE",
  };
}

export class GeminiGradingProvider {
  readonly name = "openrouter";
  readonly model = process.env.OPENROUTER_MODEL || "google/gemini-3.7-flash";

  async evaluateWriting(...args: any[]) {
    return gradeWritingThreeStage(normalizeArgs(args));
  }

  async gradeWriting(...args: any[]) {
    return this.evaluateWriting(...args);
  }

  async evaluate(...args: any[]) {
    return this.evaluateWriting(...args);
  }

  // Compatibility aliases for older Skibidi AI-service call sites.
  async gradeEssay(...args: any[]) {
    return this.evaluateWriting(...args);
  }

  async verifyGrade(resultOrInput: any, ...rest: any[]) {
    if (resultOrInput && typeof resultOrInput === "object" && "estimatedOverallBand" in resultOrInput) {
      return resultOrInput;
    }
    return this.evaluateWriting(resultOrInput, ...rest);
  }

  async generateBand7Sample(resultOrInput: any, ...rest: any[]) {
    if (resultOrInput && typeof resultOrInput === "object" && typeof resultOrInput.band7Sample === "string") {
      return resultOrInput.band7Sample;
    }
    const result = await this.evaluateWriting(resultOrInput, ...rest);
    return result.band7Sample;
  }

  async generateProFeedback(resultOrInput: any, ...rest: any[]) {
    if (resultOrInput && typeof resultOrInput === "object" && "estimatedOverallBand" in resultOrInput) {
      return {
        detailedCriterionAnalysis: resultOrInput.detailedCriterionAnalysis ?? null,
        improvedEssay: resultOrInput.improvedEssay ?? null,
        nextBandGuidance: resultOrInput.nextBandGuidance ?? null,
      };
    }
    const result = await this.evaluateWriting(resultOrInput, ...rest);
    return {
      detailedCriterionAnalysis: result.detailedCriterionAnalysis ?? null,
      improvedEssay: result.improvedEssay ?? null,
      nextBandGuidance: result.nextBandGuidance ?? null,
    };
  }

  async extractQuestion(input: any) {
    if (typeof input === "string") return input;
    return input?.questionText ?? input?.question ?? input;
  }

  async extractEssay(input: any) {
    if (typeof input === "string") return input;
    return input?.essayText ?? input?.essay ?? input;
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
