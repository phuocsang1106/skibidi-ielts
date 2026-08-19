import { describe, expect, it } from "vitest";
import { applyVerifiedBands, overallFromCriteria, roundToHalfBand } from "@/lib/ai/helpers";
import type { ExaminerOutput, VerifierOutput } from "@/lib/ai/schemas";

function criterion(name:string,band:number){return {name,band,summary:"summary",evidence:["evidence"],limitingWeaknesses:[]};}
function examiner():ExaminerOutput{return {criteria:{taskCriterion:criterion("Task Response",6.5),coherenceCohesion:criterion("Coherence & Cohesion",7),lexicalResource:criterion("Lexical Resource",6.5),grammaticalRangeAccuracy:criterion("Grammatical Range & Accuracy",7)},examinerNotes:[]};}

describe("IELTS band helpers",()=>{
  it("rounds the four-criterion mean to the nearest half band",()=>{expect(roundToHalfBand(6.75)).toBe(7);expect(roundToHalfBand(6.74)).toBe(6.5);expect(roundToHalfBand(9.3)).toBe(9);});
  it("computes overall from criterion scores instead of forcing criteria from an overall",()=>{expect(overallFromCriteria(examiner())).toBe(7);});
  it("locks verifier bands by replacing only criterion bands",()=>{const base=examiner();const verifier:VerifierOutput={finalBands:{taskCriterion:6,coherenceCohesion:7.5,lexicalResource:6.5,grammaticalRangeAccuracy:7},changes:[{criterion:"taskCriterion",from:6.5,to:6,reason:"Evidence fits Band 6"},{criterion:"coherenceCohesion",from:7,to:7.5,reason:"Stronger organization"}],verificationSummary:"Checked independently"};const locked=applyVerifiedBands(base,verifier);expect(locked.criteria.taskCriterion.band).toBe(6);expect(locked.criteria.coherenceCohesion.band).toBe(7.5);expect(locked.criteria.lexicalResource.summary).toBe(base.criteria.lexicalResource.summary);});
});
