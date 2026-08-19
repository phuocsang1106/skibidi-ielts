import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/ai/task1/all-in-one",()=>({allInOneTask1:vi.fn()}));
vi.mock("@/lib/ai/task1/extract",()=>({extractTask1:vi.fn()}));
vi.mock("@/lib/ai/task1/grade",()=>({gradeAndFeedbackTask1:vi.fn(),gradeTask1:vi.fn()}));
vi.mock("@/lib/ai/task1/verify",()=>({verifyAndFeedbackTask1:vi.fn(),verifyTask1:vi.fn()}));
vi.mock("@/lib/ai/task1/feedback",()=>({feedbackTask1:vi.fn()}));
vi.mock("@/lib/ai/task2/all-in-one",()=>({allInOneTask2:vi.fn()}));
vi.mock("@/lib/ai/task2/grade",()=>({gradeTask2:vi.fn()}));
vi.mock("@/lib/ai/task2/verify",()=>({verifyAndFeedbackTask2:vi.fn(),verifyTask2:vi.fn()}));
vi.mock("@/lib/ai/task2/feedback",()=>({feedbackTask2:vi.fn(),teachingAnalysisTask2:vi.fn()}));

import { runTask1Pipeline, runTask2Pipeline } from "@/lib/ai/pipeline";
import { allInOneTask1 } from "@/lib/ai/task1/all-in-one";
import { extractTask1 } from "@/lib/ai/task1/extract";
import { gradeAndFeedbackTask1, gradeTask1 } from "@/lib/ai/task1/grade";
import { feedbackTask1 } from "@/lib/ai/task1/feedback";
import { verifyAndFeedbackTask1, verifyTask1 } from "@/lib/ai/task1/verify";
import { allInOneTask2 } from "@/lib/ai/task2/all-in-one";
import { gradeTask2 } from "@/lib/ai/task2/grade";
import { feedbackTask2, teachingAnalysisTask2 } from "@/lib/ai/task2/feedback";
import { verifyAndFeedbackTask2, verifyTask2 } from "@/lib/ai/task2/verify";
import type { AiPipelineContext } from "@/lib/ai/types";
import type { ExaminerOutput, FeedbackOutput, Task1Extraction, VerifierOutput } from "@/lib/ai/schemas";

function criterion(name:string,band:number){return {name,band,summary:`${name} summary`,evidence:["evidence"],limitingWeaknesses:[]};}
function examiner(band=6.5):ExaminerOutput{return {criteria:{taskCriterion:criterion("Task",band),coherenceCohesion:criterion("CC",band),lexicalResource:criterion("LR",band),grammaticalRangeAccuracy:criterion("GRA",band)},examinerNotes:[]};}
const feedback:FeedbackOutput={mainIssue:"main",errors:[],sentenceImprovements:[],priorityImprovements:["priority"],band7Sample:"sample",improvedEssay:null,detailedCriterionAnalysis:null,nextBandGuidance:null};
const extraction:Task1Extraction={readable:true,confidence:.99,unreadableReason:null,questionType:"line chart",promptText:"Describe the chart",visibleLabels:[],units:[],timePeriods:[],categories:[],importantFigures:[],trends:[],comparisons:[],notableFeatures:[],overviewRelevantInformation:[]};
const verifier:VerifierOutput={finalBands:{taskCriterion:6,coherenceCohesion:7,lexicalResource:6.5,grammaticalRangeAccuracy:7},changes:[{criterion:"taskCriterion",from:6.5,to:6,reason:"lower"},{criterion:"coherenceCohesion",from:6.5,to:7,reason:"raise"}],verificationSummary:"Independent check"};
function ctx(size:number):AiPipelineContext{return {logicalSubmissionId:"logical",userId:"u",features:[],plan:{id:"p",slug:"dynamic",displayName:"Dynamic",description:"",priceVnd:0,durationDays:null,submissionLimit:1,features:[],visibility:"PUBLIC",sortOrder:0,badge:null,isActive:true,aiRequestsPerSubmission:size,defaultModel:"test/model",createdAt:new Date(),updatedAt:new Date(),aiConfig:null}};}

beforeEach(()=>{
  vi.mocked(allInOneTask2).mockResolvedValue({...examiner(),feedback});
  vi.mocked(gradeTask2).mockResolvedValue(examiner());
  vi.mocked(verifyAndFeedbackTask2).mockResolvedValue({...verifier,feedback});
  vi.mocked(verifyTask2).mockResolvedValue(verifier);
  vi.mocked(feedbackTask2).mockResolvedValue(feedback);
  vi.mocked(teachingAnalysisTask2).mockResolvedValue({errorPatterns:[],taskDevelopmentIssues:[],languagePatterns:[],teachingPriorities:[]});
  vi.mocked(extractTask1).mockResolvedValue(extraction);
  vi.mocked(allInOneTask1).mockResolvedValue({...extraction,grading:examiner(),feedback});
  vi.mocked(gradeAndFeedbackTask1).mockResolvedValue({...examiner(),feedback});
  vi.mocked(gradeTask1).mockResolvedValue(examiner());
  vi.mocked(verifyAndFeedbackTask1).mockResolvedValue({...verifier,feedback});
  vi.mocked(verifyTask1).mockResolvedValue(verifier);
  vi.mocked(feedbackTask1).mockResolvedValue(feedback);
});

describe("Task 2 runtime pipelines",()=>{
  const input={questionText:"Question",essayText:"Essay"};
  it("1 request uses all-in-one",async()=>{await runTask2Pipeline(ctx(1),input);expect(allInOneTask2).toHaveBeenCalledTimes(1);expect(gradeTask2).not.toHaveBeenCalled();});
  it("2 requests use examiner + verifier/feedback",async()=>{const result=await runTask2Pipeline(ctx(2),input);expect(gradeTask2).toHaveBeenCalledTimes(1);expect(verifyAndFeedbackTask2).toHaveBeenCalledTimes(1);expect(result.criteria.taskCriterion.band).toBe(6);expect(result.criteria.coherenceCohesion.band).toBe(7);});
  it("3 requests use examiner + independent verifier + feedback while preserving verified scores",async()=>{const result=await runTask2Pipeline(ctx(3),input);expect(gradeTask2).toHaveBeenCalledTimes(1);expect(verifyTask2).toHaveBeenCalledTimes(1);expect(feedbackTask2).toHaveBeenCalledTimes(1);expect(result.criteria.taskCriterion.band).toBe(6);expect(result.criteria.coherenceCohesion.band).toBe(7);});
  it("4 requests add teaching analysis before final feedback",async()=>{await runTask2Pipeline(ctx(4),input);expect(teachingAnalysisTask2).toHaveBeenCalledTimes(1);expect(feedbackTask2).toHaveBeenCalledTimes(1);});
});

describe("Task 1 runtime pipelines",()=>{
  const input={questionText:null,essayText:"Essay"}; const file={name:"chart.png",mimeType:"image/png" as const,dataUrl:"data:image/png;base64,AA=="};
  it("1 request is multimodal all-in-one",async()=>{await runTask1Pipeline(ctx(1),input,file);expect(allInOneTask1).toHaveBeenCalledTimes(1);expect(extractTask1).not.toHaveBeenCalled();});
  it("2 requests use visual extraction + grade/feedback",async()=>{await runTask1Pipeline(ctx(2),input,file);expect(extractTask1).toHaveBeenCalledTimes(1);expect(gradeAndFeedbackTask1).toHaveBeenCalledTimes(1);});
  it("3 requests use extraction + examiner + verifier/feedback",async()=>{const result=await runTask1Pipeline(ctx(3),input,file);expect(extractTask1).toHaveBeenCalledTimes(1);expect(gradeTask1).toHaveBeenCalledTimes(1);expect(verifyAndFeedbackTask1).toHaveBeenCalledTimes(1);expect(result.normalizedQuestion?.questionType).toBe("line chart");});
  it("4 requests use extraction + examiner + verifier + feedback",async()=>{await runTask1Pipeline(ctx(4),input,file);expect(verifyTask1).toHaveBeenCalledTimes(1);expect(feedbackTask1).toHaveBeenCalledTimes(1);});
});
