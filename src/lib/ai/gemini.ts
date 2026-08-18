import { GoogleGenAI } from "@google/genai";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { ZodType } from "zod";
import { env } from "@/lib/env";
import { toGeminiInlineData } from "@/lib/files/uploads";
import type { GradingInput, GradingProvider, ProEnhancements, VerifiedBands } from "@/lib/ai/provider";
import {
  examinerSchema,
  extractionSchema,
  proEnhancementSchema,
  sampleSchema,
  verifierSchema,
  type ExaminerResult,
  type ExtractedWritingInput
} from "@/lib/ai/schemas";

function strictBandInstruction() {
  return `Act as a strict IELTS Academic Writing examiner. Scores are estimates, not official IELTS results. Judge evidence, not vibes. Do not inflate scores to encourage the learner. Distinguish actual errors from optional style improvements. Use natural English and do not force obscure vocabulary.`;
}

function taskRubric(taskType: "TASK_1" | "TASK_2") {
  return taskType === "TASK_1"
    ? "The task criterion is Task Achievement. Check overview, key features, comparisons, accuracy and coverage of the supplied visual data. Never invent visual data."
    : "The task criterion is Task Response. Check whether all parts of the prompt are addressed, the position is clear, ideas are relevant, developed and supported.";
}

function safeJson<T>(text: string | undefined, schema: ZodType<T>) {
  if (!text) throw new Error("AI returned an empty response.");
  return schema.parse(JSON.parse(text));
}

export class GeminiGradingProvider implements GradingProvider {
  readonly name = "gemini";
  readonly model = env.GEMINI_MODEL;
  private readonly ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

  private ensureConfigured() {
    if (!env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured.");
  }

  async extractInputs(input: GradingInput): Promise<ExtractedWritingInput> {
    this.ensureConfigured();
    if (!input.questionFile && !input.writingFile && input.questionText && input.essayText) {
      return extractionSchema.parse({
        questionReadable: true,
        essayReadable: true,
        questionText: input.questionText.trim(),
        essayText: input.essayText.trim(),
        wordCount: input.essayText.trim().split(/\s+/).filter(Boolean).length,
        task1Visual: null,
        errorCode: null
      });
    }

    const parts: Array<Record<string, unknown>> = [{
      text: `Extract the IELTS ${input.taskType === "TASK_1" ? "Academic Writing Task 1" : "Writing Task 2"} input exactly.\n\nDirect question text if supplied:\n${input.questionText || "(none)"}\n\nDirect essay text if supplied:\n${input.essayText || "(none)"}\n\nFor Task 1, inspect the visual independently of the learner essay and capture its factual structure. If important labels, numbers, trends, map/process stages, or the prompt cannot be read confidently, set questionReadable=false and errorCode=QUESTION_IMAGE_UNREADABLE. Do not guess. For the essay, preserve the learner's wording. Count words from extracted essay text.`
    }];
    if (input.questionFile) parts.push(toGeminiInlineData(input.questionFile));
    if (input.writingFile) parts.push(toGeminiInlineData(input.writingFile));

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: [{ role: "user", parts }],
      config: {
        responseFormat: { text: { mimeType: "application/json", schema: zodToJsonSchema(extractionSchema) } }
      }
    });
    return safeJson(response.text, extractionSchema);
  }

  async gradeEssay(taskType: "TASK_1" | "TASK_2", input: ExtractedWritingInput, plan: "FREE" | "PRO"): Promise<ExaminerResult> {
    this.ensureConfigured();
    const detail = plan === "PRO"
      ? "Provide specific but concise evidence and explanations; detailed Pro expansion is generated separately."
      : "Keep criterion summaries concise and practical.";
    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: `${strictBandInstruction()}\n${taskRubric(taskType)}\nGrade each of the four criteria independently before thinking about any overall band. Bands must be in 0.5 increments. ${detail}\n\nQUESTION:\n${input.questionText}\n\nTASK 1 STRUCTURE:\n${JSON.stringify(input.task1Visual)}\n\nESSAY:\n${input.essayText}`,
      config: {
        responseFormat: { text: { mimeType: "application/json", schema: zodToJsonSchema(examinerSchema) } }
      }
    });
    return safeJson(response.text, examinerSchema);
  }

  async verifyGrade(taskType: "TASK_1" | "TASK_2", input: ExtractedWritingInput, initial: ExaminerResult): Promise<VerifiedBands> {
    this.ensureConfigured();
    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: `${strictBandInstruction()}\nYou are the verification pass. Check whether the initial scoring is too generous, too harsh, internally inconsistent, or based on a misunderstanding of the question. Only change a criterion band when evidence is sufficient. Bands must be in 0.5 increments.\n${taskRubric(taskType)}\n\nQUESTION:\n${input.questionText}\n\nTASK 1 STRUCTURE:\n${JSON.stringify(input.task1Visual)}\n\nESSAY:\n${input.essayText}\n\nINITIAL GRADING:\n${JSON.stringify(initial)}`,
      config: {
        responseFormat: { text: { mimeType: "application/json", schema: zodToJsonSchema(verifierSchema) } }
      }
    });
    return safeJson(response.text, verifierSchema);
  }

  async generateBand7Sample(taskType: "TASK_1" | "TASK_2", input: ExtractedWritingInput) {
    this.ensureConfigured();
    if (taskType === "TASK_1" && (!input.questionReadable || !input.task1Visual)) {
      throw new Error("QUESTION_IMAGE_UNREADABLE");
    }
    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: `Write a natural IELTS Band 7-level sample answer to the exact task below. It must be an independent answer, not a rewrite of the learner essay. Avoid obscure vocabulary and artificial perfection. ${taskType === "TASK_1" ? "Use only the extracted visual facts. Never invent a number, category, trend, stage or map feature." : "Address the exact Task 2 question with a clear position and sufficiently developed ideas."}\n\nQUESTION:\n${input.questionText}\n\nTASK 1 STRUCTURE:\n${JSON.stringify(input.task1Visual)}`,
      config: {
        responseFormat: { text: { mimeType: "application/json", schema: zodToJsonSchema(sampleSchema) } }
      }
    });
    return safeJson(response.text, sampleSchema).band7Sample;
  }

  async generateProEnhancements(taskType: "TASK_1" | "TASK_2", input: ExtractedWritingInput, verified: VerifiedBands): Promise<ProEnhancements> {
    this.ensureConfigured();
    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: `${strictBandInstruction()}\nCreate Pro feedback. Explain each criterion in detail, then improve the learner's own essay while preserving their main ideas and structure as much as reasonably possible. Target approximately Band 6.5-7 quality where appropriate. Do not replace everything with unnatural advanced vocabulary. Provide concrete actions toward the next 0.5 band.\n${taskRubric(taskType)}\n\nQUESTION:\n${input.questionText}\n\nTASK 1 STRUCTURE:\n${JSON.stringify(input.task1Visual)}\n\nESSAY:\n${input.essayText}\n\nVERIFIED BANDS:\n${JSON.stringify(verified)}`,
      config: {
        responseFormat: { text: { mimeType: "application/json", schema: zodToJsonSchema(proEnhancementSchema) } }
      }
    });
    return safeJson(response.text, proEnhancementSchema);
  }
}
