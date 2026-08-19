import { z } from "zod";

export const bandSchema = z.number().min(0).max(9).multipleOf(0.5);

export const criterionSchema = z.object({
  name: z.string().min(1),
  band: bandSchema,
  summary: z.string().min(1),
  evidence: z.array(z.string()).max(8),
  limitingWeaknesses: z.array(z.string()).max(8)
});

export const examinerSchema = z.object({
  criteria: z.object({
    taskCriterion: criterionSchema,
    coherenceCohesion: criterionSchema,
    lexicalResource: criterionSchema,
    grammaticalRangeAccuracy: criterionSchema
  }),
  examinerNotes: z.array(z.string()).max(12)
});

export const verifierSchema = z.object({
  finalBands: z.object({
    taskCriterion: bandSchema,
    coherenceCohesion: bandSchema,
    lexicalResource: bandSchema,
    grammaticalRangeAccuracy: bandSchema
  }),
  changes: z.array(z.object({
    criterion: z.enum(["taskCriterion", "coherenceCohesion", "lexicalResource", "grammaticalRangeAccuracy"]),
    from: bandSchema,
    to: bandSchema,
    reason: z.string().min(1)
  })).max(8),
  verificationSummary: z.string().min(1)
});

export const errorItemSchema = z.object({
  original: z.string(),
  issue: z.string(),
  correction: z.string(),
  explanation: z.string()
});

export const sentenceImprovementSchema = z.object({
  original: z.string(),
  improved: z.string(),
  why: z.string()
});

export const feedbackSchema = z.object({
  mainIssue: z.string().min(1),
  errors: z.array(errorItemSchema).max(20),
  sentenceImprovements: z.array(sentenceImprovementSchema).max(12),
  priorityImprovements: z.array(z.string()).min(1).max(6),
  band7Sample: z.string(),
  improvedEssay: z.string().nullable(),
  detailedCriterionAnalysis: z.record(z.string(), z.string()).nullable(),
  nextBandGuidance: z.array(z.string()).nullable()
});

export const teachingAnalysisSchema = z.object({
  errorPatterns: z.array(z.string()).max(12),
  taskDevelopmentIssues: z.array(z.string()).max(10),
  languagePatterns: z.array(z.string()).max(10),
  teachingPriorities: z.array(z.string()).max(8)
});

export const task1ExtractionSchema = z.object({
  readable: z.boolean(),
  confidence: z.number().min(0).max(1),
  unreadableReason: z.string().nullable(),
  questionType: z.string(),
  promptText: z.string(),
  visibleLabels: z.array(z.string()),
  units: z.array(z.string()),
  timePeriods: z.array(z.string()),
  categories: z.array(z.string()),
  importantFigures: z.array(z.object({ label: z.string(), value: z.string(), confidence: z.number().min(0).max(1) })),
  trends: z.array(z.string()),
  comparisons: z.array(z.string()),
  notableFeatures: z.array(z.string()),
  overviewRelevantInformation: z.array(z.string())
});

export const allInOneTask2Schema = examinerSchema.extend({ feedback: feedbackSchema });
export const verifierFeedbackSchema = verifierSchema.extend({ feedback: feedbackSchema });
export const task1AllInOneSchema = task1ExtractionSchema.extend({
  grading: examinerSchema,
  feedback: feedbackSchema
});
export const gradeFeedbackSchema = examinerSchema.extend({ feedback: feedbackSchema });

export type ExaminerOutput = z.infer<typeof examinerSchema>;
export type VerifierOutput = z.infer<typeof verifierSchema>;
export type FeedbackOutput = z.infer<typeof feedbackSchema>;
export type Task1Extraction = z.infer<typeof task1ExtractionSchema>;
export type TeachingAnalysis = z.infer<typeof teachingAnalysisSchema>;

export type FinalCriterion = z.infer<typeof criterionSchema>;
export type FinalGradingResult = {
  overallBand: number;
  criteria: ExaminerOutput["criteria"];
  mainIssue: string;
  errors: z.infer<typeof errorItemSchema>[];
  sentenceImprovements: z.infer<typeof sentenceImprovementSchema>[];
  priorityImprovements: string[];
  band7Sample: string;
  improvedEssay: string | null;
  detailedCriterionAnalysis: Record<string, string> | null;
  nextBandGuidance: string[] | null;
  verifierMetadata: { verified: boolean; changes: VerifierOutput["changes"]; summary: string } | null;
  normalizedQuestion?: Task1Extraction;
};
