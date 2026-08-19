import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";

const h=vi.hoisted(()=>{
  const prismaFind=vi.fn();
  const txFind=vi.fn();
  const txCreate=vi.fn();
  const assertCredit=vi.fn();
  const consume=vi.fn();
  const task1=vi.fn();
  const task2=vi.fn();
  const operational=vi.fn();
  const task1File=vi.fn();
  return {prismaFind,txFind,txCreate,assertCredit,consume,task1,task2,operational,task1File};
});
vi.mock("@/lib/db",()=>({prisma:{writingSubmission:{findUnique:h.prismaFind}}}));
vi.mock("@/lib/services/credits",()=>({assertCreditAvailable:h.assertCredit,consumeExactlyOneCredit:h.consume}));
vi.mock("@/lib/services/plans",()=>({getOperationalPlanForUser:h.operational}));
vi.mock("@/lib/ai/pipeline",()=>({runTask1Pipeline:h.task1,runTask2Pipeline:h.task2}));
vi.mock("@/lib/files",()=>({formFile:(v:FormDataEntryValue|null)=>v instanceof File&&v.size>0?v:null,extractTextFile:vi.fn(),task1QuestionFile:h.task1File}));
vi.mock("@/lib/transactions",()=>({withSerializableRetry:async(fn:(tx:unknown)=>Promise<unknown>)=>fn({writingSubmission:{findUnique:h.txFind,create:h.txCreate}})}));

import { submitWriting } from "@/lib/services/writing";

const plan={id:"p",slug:"dynamic",displayName:"Dynamic",description:"",priceVnd:0,durationDays:null,submissionLimit:10,features:[],visibility:"PUBLIC",sortOrder:0,badge:null,isActive:true,aiRequestsPerSubmission:3,defaultModel:"test/model",createdAt:new Date(),updatedAt:new Date(),aiConfig:null};
const grading={overallBand:6.5,criteria:{taskCriterion:{name:"Task",band:6.5,summary:"",evidence:[],limitingWeaknesses:[]},coherenceCohesion:{name:"CC",band:6.5,summary:"",evidence:[],limitingWeaknesses:[]},lexicalResource:{name:"LR",band:6.5,summary:"",evidence:[],limitingWeaknesses:[]},grammaticalRangeAccuracy:{name:"GRA",band:6.5,summary:"",evidence:[],limitingWeaknesses:[]}},mainIssue:"x",errors:[],sentenceImprovements:[],priorityImprovements:["x"],band7Sample:"sample",improvedEssay:null,detailedCriterionAnalysis:null,nextBandGuidance:null,verifierMetadata:{verified:true,changes:[],summary:"ok"}};
function task2Form(){const f=new FormData();f.set("idempotencyKey","idem-1");f.set("taskType","TASK_2");f.set("questionText","Discuss both views.");f.set("essayText","This is a learner response with enough text for the unit test.");return f;}

beforeEach(()=>{
  h.prismaFind.mockReset().mockResolvedValue(null);h.txFind.mockReset().mockResolvedValue(null);h.assertCredit.mockReset().mockResolvedValue({totalRemaining:10});h.consume.mockReset().mockResolvedValue({id:"ledger"});h.operational.mockReset().mockResolvedValue({subscription:{planNameSnapshot:"Dynamic"},plan,features:[]});h.task1.mockReset();h.task2.mockReset().mockResolvedValue(grading);h.task1File.mockReset();h.txCreate.mockReset().mockImplementation(async({data}:{data:{id:string}})=>({id:data.id,result:{}}));
});

describe("Writing quota transaction boundary",()=>{
  it("deducts exactly one user submission after a successful multi-request result is persisted",async()=>{const result=await submitWriting("u",task2Form());expect(result.reused).toBe(false);expect(h.task2).toHaveBeenCalledTimes(1);expect(h.txCreate).toHaveBeenCalledTimes(1);expect(h.consume).toHaveBeenCalledTimes(1);});
  it("does not consume quota when the AI provider fails",async()=>{h.task2.mockRejectedValue(new AppError("AI_PROVIDER_ERROR","provider down",503,"AI grading is temporarily unavailable. No Writing submission was deducted."));await expect(submitWriting("u",task2Form())).rejects.toMatchObject({code:"AI_PROVIDER_ERROR"});expect(h.txCreate).not.toHaveBeenCalled();expect(h.consume).not.toHaveBeenCalled();});
  it("does not consume quota when Task 1 is genuinely unreadable",async()=>{const f=new FormData();f.set("idempotencyKey","idem-task1");f.set("taskType","TASK_1");f.set("essayText","Learner response");const raw=new File(["image"],"chart.png",{type:"image/png"});f.set("questionFile",raw);h.task1File.mockResolvedValue({name:"chart.png",mimeType:"image/png",dataUrl:"data:image/png;base64,aW1hZ2U="});h.task1.mockRejectedValue(new AppError("QUESTION_ACTUALLY_UNREADABLE","unreadable",422,"Please upload a clearer image. No Writing submission was deducted."));await expect(submitWriting("u",f)).rejects.toMatchObject({code:"QUESTION_ACTUALLY_UNREADABLE"});expect(h.consume).not.toHaveBeenCalled();});
  it("reports a persistence failure without consuming quota",async()=>{h.txCreate.mockRejectedValue(new Error("database write failed"));await expect(submitWriting("u",task2Form())).rejects.toMatchObject({code:"WRITING_PERSISTENCE_ERROR",publicMessage:"We couldn't save your grading result. No Writing submission was deducted."});expect(h.consume).not.toHaveBeenCalled();});
  it("resolves a concurrent duplicate-key race to the already persisted winner without a second credit",async()=>{const race=Object.assign(new Error("unique"),{code:"P2002"});h.prismaFind.mockReset().mockResolvedValueOnce(null).mockResolvedValueOnce({id:"winner",result:{}});h.txCreate.mockRejectedValue(race);const result=await submitWriting("u",task2Form());expect(result).toEqual({submissionId:"winner",reused:true});expect(h.consume).not.toHaveBeenCalled();});
  it("reuses a previously persisted idempotency key without another AI call or credit",async()=>{h.prismaFind.mockResolvedValue({id:"existing"});const result=await submitWriting("u",task2Form());expect(result).toEqual({submissionId:"existing",reused:true});expect(h.task2).not.toHaveBeenCalled();expect(h.consume).not.toHaveBeenCalled();});
});
