import { afterEach, describe, expect, it } from "vitest";
import { modelForStage, pipelineSize, type OperationalPlan } from "@/lib/ai/config";

function plan(requests=3):OperationalPlan{return {id:"p",slug:"dynamic",displayName:"Dynamic",description:"",priceVnd:1000,durationDays:30,submissionLimit:10,features:[],visibility:"PUBLIC",sortOrder:0,badge:null,isActive:true,aiRequestsPerSubmission:requests,defaultModel:"default/model",createdAt:new Date(),updatedAt:new Date(),aiConfig:{id:"a",planId:"p",task1VisionModel:"vision/model",task1ExaminerModel:null,task1VerifierModel:null,task1FeedbackModel:null,task2ExaminerModel:"examiner/model",task2VerifierModel:"verifier/model",task2FeedbackModel:null,task2TeachingModel:null,updatedAt:new Date()}};}
const oldFallback=process.env.OPENROUTER_MODEL;
afterEach(()=>{process.env.OPENROUTER_MODEL=oldFallback;});

describe("runtime plan AI configuration",()=>{
  it("accepts pipeline sizes 1 through 4",()=>{for(const n of [1,2,3,4])expect(pipelineSize(plan(n))).toBe(n);});
  it("rejects invalid pipeline sizes",()=>{expect(()=>pipelineSize(plan(5))).toThrow(/Unsupported pipeline size/);});
  it("uses stage override then plan default",()=>{const p=plan();expect(modelForStage(p,"task1.extract")).toBe("vision/model");expect(modelForStage(p,"task2.examiner")).toBe("examiner/model");expect(modelForStage(p,"task2.feedback")).toBe("default/model");});
  it("uses a changed database model configuration on the next stage resolution without a deploy",()=>{const p=plan();expect(modelForStage(p,"task2.examiner")).toBe("examiner/model");if(p.aiConfig)p.aiConfig.task2ExaminerModel="new/model";expect(modelForStage(p,"task2.examiner")).toBe("new/model");});
  it("uses OPENROUTER_MODEL only as a global fallback",()=>{const p=plan();p.defaultModel=null;p.aiConfig=null;process.env.OPENROUTER_MODEL="fallback/model";expect(modelForStage(p,"task2.examiner")).toBe("fallback/model");});
});
