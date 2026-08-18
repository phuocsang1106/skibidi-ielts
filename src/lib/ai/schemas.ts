import { z } from "zod";

export const task1VisualSchema = z.object({
  visualType: z.enum(["CHART", "GRAPH", "TABLE", "MAP", "PROCESS", "OTHER"]),
  title: z.string(),
  units: z.string(),
  timePeriods: z.array(z.string()),
  categories: z.array(z.string()),
  significantNumbers: z.array(z.object({ label: z.string(), value: z.string() })),
  keyTrends: z.array(z.string()),
  mainComparisons: z.array(z.string()),
  notes: z.array(z.string())
});

export const extractionSchema = z.object({
  questionReadable: z.boolean(),
  essayReadable: z.boolean(),
  questionText: z.string(),
  essayText: z.string(),
  wordCount: z.number().int().nonnegative(),
  task1Visual: task1VisualSchema.nullable(),
  errorCode: z.enum(["QUESTION_IMAGE_UNREADABLE", "ESSAY_UNREADABLE"]).nullable()
});

const criterionSchema = z.object({
  band: z.number().min(0).max(9),
  summary: z.string(),
  evidence: z.array(z.string()).max(5),
  keyWeaknesses: z.array(z.string()).max(5)
});

export const examinerSchema = z.object({
  taskCriterion: criterionSchema,
  coherenceCohesion: criterionSchema,
  lexicalResource: criterionSchema,
  grammaticalRangeAccuracy: criterionSchema,
  errors: z.array(z.object({
    original: z.string(),
    issue: z.enum(["Grammar", "Vocabulary", "Word choice", "Collocation", "Sentence structure", "Coherence", "Repetition", "Unclear meaning", "Inappropriate formality"]),
    correction: z.string(),
    explanation: z.string()
  })).max(16),
  sentenceImprovements: z.array(z.object({ original: z.string(), improved: z.string(), reason: z.string() })).max(10),
  priorityImprovements: z.array(z.string()).min(1).max(3),
  mainIssue: z.string()
});

export const verifierSchema = z.object({
  taskCriterionBand: z.number().min(0).max(9),
  coherenceCohesionBand: z.number().min(0).max(9),
  lexicalResourceBand: z.number().min(0).max(9),
  grammaticalRangeAccuracyBand: z.number().min(0).max(9),
  adjustmentNotes: z.array(z.string()).max(4)
});

export const sampleSchema = z.object({ band7Sample: z.string().min(1) });

export const proEnhancementSchema = z.object({
  detailedCriterionAnalysis: z.object({
    taskCriterion: z.string(),
    coherenceCohesion: z.string(),
    lexicalResource: z.string(),
    grammaticalRangeAccuracy: z.string()
  }),
  improvedEssay: z.string().min(1),
  nextBandGuidance: z.array(z.string()).min(1).max(5)
});

export const finalWritingResultSchema = z.object({
  taskType: z.enum(["TASK_1", "TASK_2"]),
  estimatedOverallBand: z.number().min(0).max(9),
  criteria: z.object({
    taskCriterion: criterionSchema,
    coherenceCohesion: criterionSchema,
    lexicalResource: criterionSchema,
    grammaticalRangeAccuracy: criterionSchema
  }),
  errors: examinerSchema.shape.errors,
  sentenceImprovements: examinerSchema.shape.sentenceImprovements,
  priorityImprovements: examinerSchema.shape.priorityImprovements,
  mainIssue: z.string(),
  band7Sample: z.string(),
  detailedCriterionAnalysis: proEnhancementSchema.shape.detailedCriterionAnalysis.nullable(),
  improvedEssay: z.string().nullable(),
  nextBandGuidance: z.array(z.string()).nullable(),
  verificationNotes: z.array(z.string()),
  generatedForPlan: z.enum(["FREE", "PRO"])
});

export type ExtractedWritingInput = z.infer<typeof extractionSchema>;
export type ExaminerResult = z.infer<typeof examinerSchema>;
export type FinalWritingResult = z.infer<typeof finalWritingResultSchema>;
