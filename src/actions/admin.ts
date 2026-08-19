"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { PLAN_FEATURES, isKnownFeature } from "@/lib/features";
import { approvePayment, rejectPayment } from "@/lib/services/payments";
import { createPlan, deleteOrArchivePlan, grantManualSubmissions, updatePlan, type PlanUpsertInput } from "@/lib/services/admin";
import { auditJson, writeAudit } from "@/lib/services/audit";
import { withSerializableRetry } from "@/lib/transactions";

function str(fd: FormData, key: string) { return String(fd.get(key) || "").trim(); }
function optional(fd: FormData, key: string) { const v=str(fd,key); return v || null; }
function int(fd: FormData,key:string,min=0,max=1_000_000_000){const n=Number(str(fd,key));if(!Number.isInteger(n)||n<min||n>max)throw new AppError("INVALID_NUMBER",`${key} is invalid.`);return n;}
function optionalInt(fd:FormData,key:string,min=0,max=1_000_000_000){const raw=str(fd,key);if(!raw)return null;const n=Number(raw);if(!Number.isInteger(n)||n<min||n>max)throw new AppError("INVALID_NUMBER",`${key} is invalid.`);return n;}
function optionalDate(fd: FormData, key: string) {
  const raw = optional(fd, key);
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) throw new AppError("INVALID_DATE", `${key} is invalid.`);
  return date;
}
function promoInput(fd: FormData) {
  const rewardType = str(fd, "rewardType");
  if (rewardType !== "GRANT_PLAN" && rewardType !== "ADD_SUBMISSIONS") {
    throw new AppError("INVALID_PROMO_TYPE", "Invalid promo type.");
  }
  const code = str(fd, "code").toUpperCase();
  if (!/^[A-Z0-9_-]{3,40}$/.test(code)) throw new AppError("INVALID_PROMO_CODE", "Invalid promo code.");
  const grantPlanId = optional(fd, "grantPlanId");
  const addSubmissions = optionalInt(fd, "addSubmissions", 1, 100000);
  if (rewardType === "GRANT_PLAN" && !grantPlanId) throw new AppError("PLAN_REQUIRED", "Target plan is required.");
  if (rewardType === "ADD_SUBMISSIONS" && !addSubmissions) throw new AppError("AMOUNT_REQUIRED", "Submission amount is required.");
  return {
    code,
    rewardType,
    grantPlanId: rewardType === "GRANT_PLAN" ? grantPlanId : null,
    grantDurationDays: rewardType === "GRANT_PLAN" ? optionalInt(fd, "grantDurationDays", 1, 3650) : null,
    addSubmissions: rewardType === "ADD_SUBMISSIONS" ? addSubmissions : null,
    maxTotalRedemptions: optionalInt(fd, "maxTotalRedemptions", 1, 1000000),
    redemptionLimitPerUser: int(fd, "redemptionLimitPerUser", 1, 1000),
    expiresAt: optionalDate(fd, "expiresAt"),
    isActive: fd.get("isActive") === "on",
    activationBehavior: str(fd, "activationBehavior") === "ACTIVATE_NOW" ? "ACTIVATE_NOW" as const : "QUEUE_AFTER_CURRENT" as const
  };
}

function planInput(fd:FormData):PlanUpsertInput{
  const slug=str(fd,"slug").toLowerCase(); if(!/^[a-z0-9-]{2,40}$/.test(slug))throw new AppError("INVALID_SLUG","Invalid plan slug.");
  const visibility=str(fd,"visibility"); if(!["PUBLIC","HIDDEN","ARCHIVED"].includes(visibility))throw new AppError("INVALID_VISIBILITY","Invalid visibility.");
  const features=fd.getAll("features").map(String).filter(isKnownFeature);
  return {slug,displayName:str(fd,"displayName"),description:str(fd,"description"),priceVnd:int(fd,"priceVnd"),durationDays:optionalInt(fd,"durationDays",1,3650),submissionLimit:int(fd,"submissionLimit",0,100000),features,visibility:visibility as PlanUpsertInput["visibility"],sortOrder:int(fd,"sortOrder",-100000,100000),badge:optional(fd,"badge"),isActive:fd.get("isActive")==="on",aiRequestsPerSubmission:int(fd,"aiRequestsPerSubmission",1,4),defaultModel:optional(fd,"defaultModel"),aiConfig:{task1VisionModel:optional(fd,"task1VisionModel"),task1ExaminerModel:optional(fd,"task1ExaminerModel"),task1VerifierModel:optional(fd,"task1VerifierModel"),task1FeedbackModel:optional(fd,"task1FeedbackModel"),task2ExaminerModel:optional(fd,"task2ExaminerModel"),task2VerifierModel:optional(fd,"task2VerifierModel"),task2FeedbackModel:optional(fd,"task2FeedbackModel"),task2TeachingModel:optional(fd,"task2TeachingModel")}};
}

export async function createPlanAction(fd:FormData){const admin=await requireAdmin();const plan=await createPlan(admin.id,planInput(fd));revalidatePath("/admin/plans");revalidatePath("/pricing");redirect(`/admin/plans/${plan.id}`);}
export async function updatePlanAction(planId:string,fd:FormData){const admin=await requireAdmin();await updatePlan(admin.id,planId,planInput(fd),optional(fd,"reason")||undefined);revalidatePath(`/admin/plans/${planId}`);revalidatePath("/admin/plans");revalidatePath("/pricing");revalidatePath("/app/pricing");}
export async function deleteOrArchivePlanAction(planId:string,_fd?:FormData){const admin=await requireAdmin();await deleteOrArchivePlan(admin.id,planId);revalidatePath("/admin/plans");revalidatePath("/pricing");redirect("/admin/plans");}

export async function grantCreditsAction(userId:string,fd:FormData){const admin=await requireAdmin();await grantManualSubmissions(admin.id,userId,int(fd,"amount",1,100000),str(fd,"reason"));revalidatePath(`/admin/users/${userId}`);}
export async function approvePaymentAction(orderId:string,_fd?:FormData){const admin=await requireAdmin();await approvePayment(admin.id,orderId);revalidatePath("/admin/payments");}
export async function rejectPaymentAction(orderId:string,fd:FormData){const admin=await requireAdmin();await rejectPayment(admin.id,orderId,str(fd,"reason")||"Rejected by admin");revalidatePath("/admin/payments");}

export async function createPromoAction(fd: FormData) {
  const admin = await requireAdmin();
  const input = promoInput(fd);
  if (input.rewardType === "GRANT_PLAN" && input.grantPlanId) {
    const plan = await prisma.plan.findUnique({ where: { id: input.grantPlanId } });
    if (!plan) throw new AppError("PLAN_NOT_FOUND", "Target plan was not found.");
    if (input.isActive && (!plan.isActive || plan.visibility === "ARCHIVED")) {
      throw new AppError("PLAN_UNAVAILABLE", "Target plan cannot receive new grants.");
    }
  }
  const promo = await prisma.promoCode.create({ data: input });
  await prisma.adminAuditLog.create({
    data: {
      adminId: admin.id,
      action: "PROMO_CREATED",
      entityType: "PromoCode",
      entityId: promo.id,
      afterJson: { code: promo.code, rewardType: promo.rewardType }
    }
  });
  revalidatePath("/admin/promo-codes");
  redirect(`/admin/promo-codes/${promo.id}`);
}

export async function updatePromoAction(id: string, fd: FormData) {
  const admin = await requireAdmin();
  const input = promoInput(fd);
  await withSerializableRetry(async (tx) => {
    const before = await tx.promoCode.findUnique({ where: { id } });
    if (!before) throw new AppError("PROMO_NOT_FOUND", "Promo not found.", 404);
    if (input.rewardType === "GRANT_PLAN" && input.grantPlanId) {
      const plan = await tx.plan.findUnique({ where: { id: input.grantPlanId } });
      if (!plan) throw new AppError("PLAN_NOT_FOUND", "Target plan was not found.");
      if (input.isActive && (!plan.isActive || plan.visibility === "ARCHIVED")) {
        throw new AppError("PLAN_UNAVAILABLE", "Target plan cannot receive new grants.");
      }
    }
    const after = await tx.promoCode.update({ where: { id }, data: input });
    await writeAudit(tx, {
      adminId: admin.id,
      action: "PROMO_UPDATED",
      entityType: "PromoCode",
      entityId: id,
      beforeJson: auditJson(before),
      afterJson: auditJson(after)
    });
  });
  revalidatePath(`/admin/promo-codes/${id}`);
  revalidatePath("/admin/promo-codes");
}
export async function archivePromoAction(id:string,_fd?:FormData){const admin=await requireAdmin();await withSerializableRetry(async tx=>{const before=await tx.promoCode.findUnique({where:{id}});if(!before)return;const after=await tx.promoCode.update({where:{id},data:{archivedAt:new Date(),isActive:false}});await writeAudit(tx,{adminId:admin.id,action:"PROMO_ARCHIVED",entityType:"PromoCode",entityId:id,beforeJson:auditJson(before),afterJson:auditJson(after)});});revalidatePath("/admin/promo-codes");redirect("/admin/promo-codes");}

export async function updateReportStatusAction(id:string,fd:FormData){const admin=await requireAdmin();const status=str(fd,"status");if(!["OPEN","REVIEWING","RESOLVED","DISMISSED"].includes(status))return;await withSerializableRetry(async tx=>{const before=await tx.problemReport.findUnique({where:{id}});if(!before)return;const after=await tx.problemReport.update({where:{id},data:{status:status as "OPEN"|"REVIEWING"|"RESOLVED"|"DISMISSED"}});await writeAudit(tx,{adminId:admin.id,action:"REPORT_STATUS_CHANGED",entityType:"ProblemReport",entityId:id,beforeJson:{status:before.status},afterJson:{status:after.status}});});revalidatePath("/admin/reports");}

export async function createVocabularyLevelAction(fd:FormData){await requireAdmin();await prisma.vocabularyLevel.create({data:{slug:str(fd,"slug"),name:str(fd,"name"),bandRange:str(fd,"bandRange"),requiredFeature:optional(fd,"requiredFeature"),description:optional(fd,"description"),sortOrder:int(fd,"sortOrder",-10000,10000)}});revalidatePath("/admin/vocabulary");revalidatePath("/app/vocabulary");}
export async function createVocabularyTopicAction(fd:FormData){await requireAdmin();await prisma.vocabularyTopic.create({data:{levelId:str(fd,"levelId"),slug:str(fd,"slug"),name:str(fd,"name"),description:optional(fd,"description"),requiredFeature:optional(fd,"requiredFeature"),sortOrder:int(fd,"sortOrder",-10000,10000)}});revalidatePath("/admin/vocabulary");revalidatePath("/app/vocabulary");}
export async function createVocabularyWordAction(fd:FormData){await requireAdmin();await prisma.vocabularyWord.create({data:{topicId:str(fd,"topicId"),word:str(fd,"word"),ipa:optional(fd,"ipa"),partOfSpeech:str(fd,"partOfSpeech"),vietnameseMeaning:str(fd,"vietnameseMeaning"),collocations:str(fd,"collocations").split(",").map(x=>x.trim()).filter(Boolean),synonyms:str(fd,"synonyms").split(",").map(x=>x.trim()).filter(Boolean),exampleSentence:str(fd,"exampleSentence"),usageNote:optional(fd,"usageNote"),sortOrder:int(fd,"sortOrder",-10000,10000)}});revalidatePath("/admin/vocabulary");revalidatePath("/app/vocabulary");}

export async function updatePaymentSettingsAction(fd:FormData){const admin=await requireAdmin();const value={configured:fd.get("configured")==="on",bankName:str(fd,"bankName"),bankCode:optional(fd,"bankCode")||"",accountNumber:str(fd,"accountNumber"),accountName:str(fd,"accountName"),qrUrlTemplate:optional(fd,"qrUrlTemplate")||""};await withSerializableRetry(async tx=>{const before=await tx.appSetting.findUnique({where:{key:"PAYMENT_BANK"}});await tx.appSetting.upsert({where:{key:"PAYMENT_BANK"},update:{value},create:{key:"PAYMENT_BANK",value}});await writeAudit(tx,{adminId:admin.id,action:"PAYMENT_SETTINGS_UPDATED",entityType:"AppSetting",entityId:"PAYMENT_BANK",beforeJson:auditJson(before?.value||{}),afterJson:auditJson(value)});});revalidatePath("/admin/settings");revalidatePath("/app/pricing");}

export const adminFeatureRegistry=PLAN_FEATURES;

export async function updateVocabularyLevelAction(id:string,fd:FormData){const admin=await requireAdmin();await withSerializableRetry(async tx=>{const before=await tx.vocabularyLevel.findUnique({where:{id}});if(!before)throw new AppError("LEVEL_NOT_FOUND","Vocabulary level not found.",404);const after=await tx.vocabularyLevel.update({where:{id},data:{slug:str(fd,"slug"),name:str(fd,"name"),bandRange:str(fd,"bandRange"),requiredFeature:optional(fd,"requiredFeature"),description:optional(fd,"description"),sortOrder:int(fd,"sortOrder",-10000,10000),isActive:fd.get("isActive")==="on"}});await writeAudit(tx,{adminId:admin.id,action:"VOCAB_LEVEL_UPDATED",entityType:"VocabularyLevel",entityId:id,beforeJson:auditJson(before),afterJson:auditJson(after)});});revalidatePath("/admin/vocabulary");revalidatePath("/app/vocabulary");}
export async function updateVocabularyTopicAction(id:string,fd:FormData){const admin=await requireAdmin();await withSerializableRetry(async tx=>{const before=await tx.vocabularyTopic.findUnique({where:{id}});if(!before)throw new AppError("TOPIC_NOT_FOUND","Vocabulary topic not found.",404);const after=await tx.vocabularyTopic.update({where:{id},data:{levelId:str(fd,"levelId"),slug:str(fd,"slug"),name:str(fd,"name"),requiredFeature:optional(fd,"requiredFeature"),description:optional(fd,"description"),sortOrder:int(fd,"sortOrder",-10000,10000),isActive:fd.get("isActive")==="on"}});await writeAudit(tx,{adminId:admin.id,action:"VOCAB_TOPIC_UPDATED",entityType:"VocabularyTopic",entityId:id,beforeJson:auditJson(before),afterJson:auditJson(after)});});revalidatePath("/admin/vocabulary");revalidatePath("/app/vocabulary");}
export async function updateVocabularyWordAction(id:string,fd:FormData){const admin=await requireAdmin();await withSerializableRetry(async tx=>{const before=await tx.vocabularyWord.findUnique({where:{id}});if(!before)throw new AppError("WORD_NOT_FOUND","Vocabulary word not found.",404);const after=await tx.vocabularyWord.update({where:{id},data:{topicId:str(fd,"topicId"),word:str(fd,"word"),ipa:optional(fd,"ipa"),partOfSpeech:str(fd,"partOfSpeech"),vietnameseMeaning:str(fd,"vietnameseMeaning"),collocations:str(fd,"collocations").split(",").map(x=>x.trim()).filter(Boolean),synonyms:str(fd,"synonyms").split(",").map(x=>x.trim()).filter(Boolean),exampleSentence:str(fd,"exampleSentence"),usageNote:optional(fd,"usageNote"),sortOrder:int(fd,"sortOrder",-10000,10000),isActive:fd.get("isActive")==="on"}});await writeAudit(tx,{adminId:admin.id,action:"VOCAB_WORD_UPDATED",entityType:"VocabularyWord",entityId:id,beforeJson:auditJson(before),afterJson:auditJson(after)});});revalidatePath("/admin/vocabulary");revalidatePath("/app/vocabulary");}
