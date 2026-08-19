import type { ExaminerOutput, FinalGradingResult, FeedbackOutput, VerifierOutput } from "@/lib/ai/schemas";

export function roundToHalfBand(value: number) {
  return Math.max(0, Math.min(9, Math.round(value * 2) / 2));
}

export function applyVerifiedBands(examiner: ExaminerOutput, verifier: VerifierOutput): ExaminerOutput {
  return {
    ...examiner,
    criteria: {
      taskCriterion: { ...examiner.criteria.taskCriterion, band: verifier.finalBands.taskCriterion },
      coherenceCohesion: { ...examiner.criteria.coherenceCohesion, band: verifier.finalBands.coherenceCohesion },
      lexicalResource: { ...examiner.criteria.lexicalResource, band: verifier.finalBands.lexicalResource },
      grammaticalRangeAccuracy: { ...examiner.criteria.grammaticalRangeAccuracy, band: verifier.finalBands.grammaticalRangeAccuracy }
    }
  };
}

export function overallFromCriteria(examiner: ExaminerOutput) {
  const c = examiner.criteria;
  return roundToHalfBand((c.taskCriterion.band + c.coherenceCohesion.band + c.lexicalResource.band + c.grammaticalRangeAccuracy.band) / 4);
}

export function finalResult(examiner: ExaminerOutput, feedback: FeedbackOutput, verifier: VerifierOutput | null): FinalGradingResult {
  return {
    overallBand: overallFromCriteria(examiner),
    criteria: examiner.criteria,
    mainIssue: feedback.mainIssue,
    errors: feedback.errors,
    sentenceImprovements: feedback.sentenceImprovements,
    priorityImprovements: feedback.priorityImprovements,
    band7Sample: feedback.band7Sample,
    improvedEssay: feedback.improvedEssay,
    detailedCriterionAnalysis: feedback.detailedCriterionAnalysis,
    nextBandGuidance: feedback.nextBandGuidance,
    verifierMetadata: verifier ? { verified: true, changes: verifier.changes, summary: verifier.verificationSummary } : null
  };
}
