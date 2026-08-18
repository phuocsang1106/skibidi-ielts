import type { PreparedFile } from "@/lib/files/uploads";
import type { ExaminerResult, ExtractedWritingInput } from "@/lib/ai/schemas";

export type GradingInput = {
  taskType: "TASK_1" | "TASK_2";
  questionText?: string;
  essayText?: string;
  questionFile?: PreparedFile;
  writingFile?: PreparedFile;
};

export type VerifiedBands = {
  taskCriterionBand: number;
  coherenceCohesionBand: number;
  lexicalResourceBand: number;
  grammaticalRangeAccuracyBand: number;
  adjustmentNotes: string[];
};

export type ProEnhancements = {
  detailedCriterionAnalysis: {
    taskCriterion: string;
    coherenceCohesion: string;
    lexicalResource: string;
    grammaticalRangeAccuracy: string;
  };
  improvedEssay: string;
  nextBandGuidance: string[];
};

export interface GradingProvider {
  readonly name: string;
  readonly model: string;
  extractInputs(input: GradingInput): Promise<ExtractedWritingInput>;
  gradeEssay(taskType: GradingInput["taskType"], input: ExtractedWritingInput, plan: "FREE" | "PRO"): Promise<ExaminerResult>;
  verifyGrade(taskType: GradingInput["taskType"], input: ExtractedWritingInput, initial: ExaminerResult): Promise<VerifiedBands>;
  generateBand7Sample(taskType: GradingInput["taskType"], input: ExtractedWritingInput): Promise<string>;
  generateProEnhancements(taskType: GradingInput["taskType"], input: ExtractedWritingInput, verified: VerifiedBands): Promise<ProEnhancements>;
}
