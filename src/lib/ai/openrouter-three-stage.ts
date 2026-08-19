import { z } from "zod";
import { callOpenRouterJson, dataUrl, type OpenRouterMessage } from "./openrouter-client";
import { normalizeQuestionFile } from "./openrouter-file-normalizer";
import { IELTS_WRITING_RUBRIC_2023 } from "./ielts-rubric-2023";

const halfBand = z.number().min(0).max(9).refine((v: number) => Number.isInteger(v * 2));
const criterion = z.object({
  band: halfBand,
  summary: z.string(),
  evidence: z.array(z.string()).max(6),
  keyWeaknesses: z.array(z.string()).max(6),
});
const initialGradeSchema = z.object({
  taskType: z.enum(["TASK_1", "TASK_2"]),
  criteria: z.object({
    taskCriterion: criterion,
    coherenceCohesion: criterion,
    lexicalResource: criterion,
    grammaticalRangeAccuracy: criterion,
  }),
  mainIssue: z.string(),
  graderNotes: z.array(z.string()).max(6),
});
const verifiedSchema = z.object({
  criteria: z.object({
    taskCriterion: halfBand,
    coherenceCohesion: halfBand,
    lexicalResource: halfBand,
    grammaticalRangeAccuracy: halfBand,
  }),
  changes: z.array(z.object({
    criterion: z.enum(["taskCriterion", "coherenceCohesion", "lexicalResource", "grammaticalRangeAccuracy"]),
    from: halfBand,
    to: halfBand,
    reason: z.string(),
  })),
  verifierSummary: z.string(),
});
const feedbackSchema = z.object({
  mainIssue: z.string(),
  priorityImprovements: z.array(z.string()).min(1).max(3),
  errors: z.array(z.object({
    original: z.string(),
    issue: z.string(),
    correction: z.string(),
    explanation: z.string(),
  })),
  sentenceImprovements: z.array(z.object({
    original: z.string(),
    improved: z.string(),
    reason: z.string(),
  })),
  band7Sample: z.string(),
  improvedEssay: z.string().nullable(),
  nextBandGuidance: z.array(z.string()).nullable(),
  detailedCriterionAnalysis: z.object({
    taskCriterion: z.string(),
    coherenceCohesion: z.string(),
    lexicalResource: z.string(),
    grammaticalRangeAccuracy: z.string(),
  }).nullable(),
});
const task1ExtractSchema = z.object({
  readable: z.boolean(),
  questionText: z.string(),
  structuredQuestionData: z.object({
    visualType: z.string(),
    title: z.string().nullable(),
    units: z.array(z.string()),
    timePeriods: z.array(z.string()),
    categories: z.array(z.string()),
    significantNumbers: z.array(z.string()),
    keyTrends: z.array(z.string()),
    mainComparisons: z.array(z.string()),
    notableChanges: z.array(z.string()),
  }).nullable(),
  unreadableReason: z.string().nullable(),
});

const bandJson = { type: "number", enum: [0,0.5,1,1.5,2,2.5,3,3.5,4,4.5,5,5.5,6,6.5,7,7.5,8,8.5,9] } as const;
const criterionJson = {
  type: "object", additionalProperties: false,
  properties: {
    band: bandJson,
    summary: { type: "string" },
    evidence: { type: "array", items: { type: "string" } },
    keyWeaknesses: { type: "array", items: { type: "string" } },
  },
  required: ["band","summary","evidence","keyWeaknesses"],
} as const;
const initialGradeJson = {
  type: "object", additionalProperties: false,
  properties: {
    taskType: { type: "string", enum: ["TASK_1","TASK_2"] },
    criteria: { type: "object", additionalProperties: false, properties: {
      taskCriterion: criterionJson, coherenceCohesion: criterionJson,
      lexicalResource: criterionJson, grammaticalRangeAccuracy: criterionJson,
    }, required: ["taskCriterion","coherenceCohesion","lexicalResource","grammaticalRangeAccuracy"] },
    mainIssue: { type: "string" },
    graderNotes: { type: "array", items: { type: "string" } },
  },
  required: ["taskType","criteria","mainIssue","graderNotes"],
};
const verifiedJson = {
  type: "object", additionalProperties: false,
  properties: {
    criteria: { type: "object", additionalProperties: false, properties: {
      taskCriterion: bandJson, coherenceCohesion: bandJson,
      lexicalResource: bandJson, grammaticalRangeAccuracy: bandJson,
    }, required: ["taskCriterion","coherenceCohesion","lexicalResource","grammaticalRangeAccuracy"] },
    changes: { type: "array", items: { type: "object", additionalProperties: false, properties: {
      criterion: { type: "string", enum: ["taskCriterion","coherenceCohesion","lexicalResource","grammaticalRangeAccuracy"] },
      from: bandJson, to: bandJson, reason: { type: "string" },
    }, required: ["criterion","from","to","reason"] } },
    verifierSummary: { type: "string" },
  },
  required: ["criteria","changes","verifierSummary"],
};
const feedbackJson = {
  type: "object", additionalProperties: false,
  properties: {
    mainIssue: { type: "string" },
    priorityImprovements: { type: "array", items: { type: "string" } },
    errors: { type: "array", items: { type: "object", additionalProperties: false, properties: {
      original: { type: "string" }, issue: { type: "string" }, correction: { type: "string" }, explanation: { type: "string" },
    }, required: ["original","issue","correction","explanation"] } },
    sentenceImprovements: { type: "array", items: { type: "object", additionalProperties: false, properties: {
      original: { type: "string" }, improved: { type: "string" }, reason: { type: "string" },
    }, required: ["original","improved","reason"] } },
    band7Sample: { type: "string" },
    improvedEssay: { anyOf: [{ type: "string" }, { type: "null" }] },
    nextBandGuidance: { anyOf: [{ type: "array", items: { type: "string" } }, { type: "null" }] },
    detailedCriterionAnalysis: { anyOf: [{ type: "object", additionalProperties: false, properties: {
      taskCriterion: { type: "string" }, coherenceCohesion: { type: "string" },
      lexicalResource: { type: "string" }, grammaticalRangeAccuracy: { type: "string" },
    }, required: ["taskCriterion","coherenceCohesion","lexicalResource","grammaticalRangeAccuracy"] }, { type: "null" }] },
  },
  required: ["mainIssue","priorityImprovements","errors","sentenceImprovements","band7Sample","improvedEssay","nextBandGuidance","detailedCriterionAnalysis"],
};
const task1ExtractJson = {
  type: "object", additionalProperties: false,
  properties: {
    readable: { type: "boolean" },
    questionText: { type: "string" },
    structuredQuestionData: { anyOf: [{ type: "object", additionalProperties: false, properties: {
      visualType: { type: "string" }, title: { anyOf: [{ type: "string" }, { type: "null" }] },
      units: { type: "array", items: { type: "string" } }, timePeriods: { type: "array", items: { type: "string" } },
      categories: { type: "array", items: { type: "string" } }, significantNumbers: { type: "array", items: { type: "string" } },
      keyTrends: { type: "array", items: { type: "string" } }, mainComparisons: { type: "array", items: { type: "string" } },
      notableChanges: { type: "array", items: { type: "string" } },
    }, required: ["visualType","title","units","timePeriods","categories","significantNumbers","keyTrends","mainComparisons","notableChanges"] }, { type: "null" }] },
    unreadableReason: { anyOf: [{ type: "string" }, { type: "null" }] },
  },
  required: ["readable","questionText","structuredQuestionData","unreadableReason"],
};

export type ThreeStageInput = {
  taskType: "TASK_1" | "TASK_2";
  questionText?: string;
  essayText: string;
  plan: "FREE" | "PRO";
  questionFile?: unknown;
};

function overallBand(values: number[]) {
  return Math.round((values.reduce((a,b) => a + b, 0) / values.length) * 2) / 2;
}

async function task1Extract(input: ThreeStageInput) {
  if (!input.questionFile) {
    return { readable: true, questionText: input.questionText || "", structuredQuestionData: null, unreadableReason: null };
  }

  const normalizedFile = await normalizeQuestionFile(input.questionFile);
  if (!normalizedFile) {
    const error = new Error("Unsupported or empty Task 1 question file payload.");
    (error as Error & { code?: string }).code = "QUESTION_FILE_INVALID";
    throw error;
  }

  const { buffer, mimeType, filename } = normalizedFile;
  const content: Extract<OpenRouterMessage["content"], unknown[]> = [
    { type: "text", text: "Read this IELTS Academic Writing Task 1 prompt and its visual carefully. Extract only information you can confidently read. Never invent numbers. Set readable=true when the task instruction and the main visual information needed to assess the essay are legible, even if a non-essential tiny label is imperfect. Set readable=false only when missing, cropped, blurred or illegible information would make reliable Task Achievement grading unsafe." },
  ];
  if (mimeType === "application/pdf") content.push({ type: "file", file: { filename, file_data: dataUrl(buffer, mimeType) } });
  else content.push({ type: "image_url", image_url: { url: dataUrl(buffer, mimeType) } });
  const response = await callOpenRouterJson<unknown>({
    schemaName: "ielts_task1_extract", schema: task1ExtractJson as Record<string, unknown>, maxTokens: 3000,
    messages: [{ role: "system", content: "You are a precise document/visual extractor. Do not grade the essay and do not guess unreadable data." }, { role: "user", content }],
  });
  return task1ExtractSchema.parse(response.data);
}

export async function gradeWritingThreeStage(input: ThreeStageInput) {
  let extractedTask1: Awaited<ReturnType<typeof task1Extract>> | null = null;
  let question = input.questionText || "";

  // REQUEST 1 for Task 1 = visual extraction. For Task 2, REQUEST 1 = examiner.
  if (input.taskType === "TASK_1") {
    extractedTask1 = await task1Extract(input);
    if (!extractedTask1.readable) {
      const err = new Error(extractedTask1.unreadableReason || "QUESTION_IMAGE_UNREADABLE");
      (err as Error & { code?: string }).code = "QUESTION_IMAGE_UNREADABLE";
      throw err;
    }
    question = extractedTask1.questionText || question;
  }

  const graderMessages: OpenRouterMessage[] = [
    { role: "system", content: `You are a strict IELTS Writing examiner.\n\n${IELTS_WRITING_RUBRIC_2023}\n\nScore the four criteria independently. Do NOT generate a Band 7 sample or rewritten essay. Return only the required JSON.` },
    { role: "user", content: `TASK TYPE: ${input.taskType}\n\nQUESTION:\n${question}\n\n${extractedTask1?.structuredQuestionData ? `EXTRACTED TASK 1 DATA:\n${JSON.stringify(extractedTask1.structuredQuestionData)}\n\n` : ""}CANDIDATE RESPONSE:\n${input.essayText}` },
  ];

  // Task 2 request 1; Task 1 request 2.
  const rawGrade = await callOpenRouterJson<unknown>({ schemaName: "ielts_examiner", schema: initialGradeJson as Record<string, unknown>, messages: graderMessages, maxTokens: 4500 });
  const grade = initialGradeSchema.parse(rawGrade.data);

  const verifierSystem = `You are an independent second IELTS Writing examiner.\n\n${IELTS_WRITING_RUBRIC_2023}\n\nCheck each first-examiner criterion score for generosity, harshness, unsupported evidence, prompt misunderstanding and descriptor mismatch. Change a score only when evidence clearly justifies it.`;

  if (input.taskType === "TASK_2") {
    // REQUEST 2 = verifier.
    const rawVerified = await callOpenRouterJson<unknown>({
      schemaName: "ielts_verifier", schema: verifiedJson as Record<string, unknown>, messages: [
        { role: "system", content: verifierSystem },
        { role: "user", content: `QUESTION:\n${question}\n\nESSAY:\n${input.essayText}\n\nFIRST EXAMINER:\n${JSON.stringify(grade)}` },
      ], maxTokens: 3000,
    });
    const verified = verifiedSchema.parse(rawVerified.data);
    const finalBand = overallBand(Object.values(verified.criteria));

    // REQUEST 3 = feedback. Scores are locked.
    const rawFeedback = await callOpenRouterJson<unknown>({
      schemaName: "ielts_feedback", schema: feedbackJson as Record<string, unknown>, temperature: 0.2, maxTokens: input.plan === "PRO" ? 6500 : 4200,
      messages: [
        { role: "system", content: `You are an IELTS Writing feedback specialist. Scores are LOCKED and MUST NOT be changed. Final scores: ${JSON.stringify(verified.criteria)}. Final task band: ${finalBand}. Identify genuine errors; distinguish errors from optional style advice; preserve meaning; keep the Band 7 sample natural and answer the exact question. ${input.plan === "FREE" ? "FREE plan: improvedEssay=null, nextBandGuidance=null, detailedCriterionAnalysis=null, explanations concise." : "PRO plan: include detailed criterion analysis, improved essay preserving core ideas, and next-band guidance."}` },
        { role: "user", content: `QUESTION:\n${question}\n\nESSAY:\n${input.essayText}\n\nVERIFIED EXAMINER CONTEXT:\n${JSON.stringify({ grade, verified })}` },
      ],
    });
    const feedback = feedbackSchema.parse(rawFeedback.data);
    return assembleFinal(input, question, extractedTask1, grade, verified, feedback, finalBand);
  }

  // TASK 1 REQUEST 3 = verifier + feedback in one call.
  // This keeps total model requests at three: visual extraction -> examiner -> verifier+feedback.
  const combinedJson = {
    type: "object", additionalProperties: false,
    properties: { verified: verifiedJson, feedback: feedbackJson },
    required: ["verified","feedback"],
  } as Record<string, unknown>;
  const combinedSchema = z.object({ verified: verifiedSchema, feedback: feedbackSchema });
  const rawCombined = await callOpenRouterJson<unknown>({
    schemaName: "ielts_task1_verify_feedback", schema: combinedJson, temperature: 0.1, maxTokens: input.plan === "PRO" ? 7000 : 4800,
    messages: [
      { role: "system", content: `${verifierSystem}\n\nAfter verifying scores, also generate feedback consistent with the VERIFIED scores. Never invent Task 1 numbers. The Band 7 sample must use only the extracted visual data. ${input.plan === "FREE" ? "FREE plan: improvedEssay=null, nextBandGuidance=null, detailedCriterionAnalysis=null." : "PRO plan: include detailed analysis, improved essay, and next-band guidance."}` },
      { role: "user", content: `QUESTION:\n${question}\n\nEXTRACTED TASK 1 DATA:\n${JSON.stringify(extractedTask1?.structuredQuestionData)}\n\nESSAY:\n${input.essayText}\n\nFIRST EXAMINER:\n${JSON.stringify(grade)}` },
    ],
  });
  const { verified, feedback } = combinedSchema.parse(rawCombined.data);
  const finalBand = overallBand(Object.values(verified.criteria));
  return assembleFinal(input, question, extractedTask1, grade, verified, feedback, finalBand);
}

function assembleFinal(
  input: ThreeStageInput,
  question: string,
  extractedTask1: Awaited<ReturnType<typeof task1Extract>> | null,
  grade: z.infer<typeof initialGradeSchema>,
  verified: z.infer<typeof verifiedSchema>,
  feedback: z.infer<typeof feedbackSchema>,
  finalBand: number,
) {
  const taskCriterion = { ...grade.criteria.taskCriterion, band: verified.criteria.taskCriterion };
  const coherenceCohesion = { ...grade.criteria.coherenceCohesion, band: verified.criteria.coherenceCohesion };
  const lexicalResource = { ...grade.criteria.lexicalResource, band: verified.criteria.lexicalResource };
  const grammaticalRangeAccuracy = { ...grade.criteria.grammaticalRangeAccuracy, band: verified.criteria.grammaticalRangeAccuracy };

  return {
    taskType: input.taskType,
    questionText: question,
    structuredQuestionData: extractedTask1?.structuredQuestionData ?? null,
    estimatedOverallBand: finalBand,

    // Legacy service.ts reads these four fields directly.
    taskCriterion,
    coherenceCohesion,
    lexicalResource,
    grammaticalRangeAccuracy,

    // Newer UI/service code can use the grouped representation.
    criteria: {
      taskCriterion,
      coherenceCohesion,
      lexicalResource,
      grammaticalRangeAccuracy,
    },
    mainIssue: feedback.mainIssue,
    errors: feedback.errors,
    sentenceImprovements: feedback.sentenceImprovements,
    priorityImprovements: feedback.priorityImprovements,
    band7Sample: feedback.band7Sample,
    improvedEssay: feedback.improvedEssay,
    nextBandGuidance: feedback.nextBandGuidance,
    detailedCriterionAnalysis: feedback.detailedCriterionAnalysis,
    verifier: { changes: verified.changes, summary: verified.verifierSummary },
    gradingProvider: "openrouter",
    gradingModel: process.env.OPENROUTER_MODEL || "google/gemini-3.7-flash",
  };
}
