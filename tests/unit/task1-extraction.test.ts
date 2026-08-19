import { beforeEach, describe, expect, it, vi } from "vitest";
const h=vi.hoisted(()=>({call:vi.fn()}));
vi.mock("@/lib/ai/client",()=>({callOpenRouterStructured:h.call}));
import { extractTask1 } from "@/lib/ai/task1/extract";
import { AppError } from "@/lib/errors";
import type { AiPipelineContext } from "@/lib/ai/types";

function ctx():AiPipelineContext{return {logicalSubmissionId:"x",userId:"u",features:[],plan:{id:"p",slug:"p",displayName:"P",description:"",priceVnd:0,durationDays:null,submissionLimit:1,features:[],visibility:"PUBLIC",sortOrder:0,badge:null,isActive:true,aiRequestsPerSubmission:2,defaultModel:"test/model",createdAt:new Date(),updatedAt:new Date(),aiConfig:null}};}
const file={name:"chart.png",mimeType:"image/png" as const,dataUrl:"data:image/png;base64,AA=="};
beforeEach(()=>h.call.mockReset());

describe("Task 1 extraction error categories",()=>{
  it("does not mislabel a provider failure as an unreadable image",async()=>{h.call.mockRejectedValue(new AppError("AI_PROVIDER_ERROR","provider",503,"AI grading is temporarily unavailable. No Writing submission was deducted."));await expect(extractTask1(ctx(),null,file)).rejects.toMatchObject({code:"AI_PROVIDER_ERROR"});});
  it("uses QUESTION_ACTUALLY_UNREADABLE only when the multimodal result says the visual is unreadable",async()=>{h.call.mockResolvedValue({readable:false,confidence:.2,unreadableReason:"Axis labels are blurred",questionType:"unknown",promptText:"",visibleLabels:[],units:[],timePeriods:[],categories:[],importantFigures:[],trends:[],comparisons:[],notableFeatures:[],overviewRelevantInformation:[]});await expect(extractTask1(ctx(),null,file)).rejects.toMatchObject({code:"QUESTION_ACTUALLY_UNREADABLE"});});
  it("instructs the multimodal extractor not to hallucinate unreadable numbers",async()=>{h.call.mockResolvedValue({readable:true,confidence:.9,unreadableReason:null,questionType:"chart",promptText:"Prompt",visibleLabels:[],units:[],timePeriods:[],categories:[],importantFigures:[],trends:[],comparisons:[],notableFeatures:[],overviewRelevantInformation:[]});await extractTask1(ctx(),null,file);const content=h.call.mock.calls[0]?.[0]?.messages?.[0]?.content;expect(String(content)).toContain("Never invent unreadable numbers");});
});
