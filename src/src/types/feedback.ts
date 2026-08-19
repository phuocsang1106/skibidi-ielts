export type CriterionFeedback = {
  name: string;
  band: number;
  explanation: string;
  mistakes: string[];
  correction: string;
};

export type WritingFeedback = {
  overallBand: number;
  summary: string;
  criteria: CriterionFeedback[];
  errorCorrection?: Array<{ original: string; corrected: string; explanation: string }>;
  band7Sample?: string;
  improvedEssay?: string;
  nextBandGuidance?: string[];
};

export type PlanFeatures = {
  bandScore: boolean;
  criteria: boolean;
  errorCorrection: boolean;
  band7Sample: boolean;
  improvedEssay: boolean;
  nextBandGuidance: boolean;
};
