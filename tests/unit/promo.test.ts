import { beforeEach, describe, expect, it, vi } from "vitest";
const h=vi.hoisted(()=>({promoFind:vi.fn(),count:vi.fn(),create:vi.fn(),add:vi.fn(),grant:vi.fn()}));
vi.mock("@/lib/services/credits",()=>({addBonusSubmissions:h.add}));
vi.mock("@/lib/services/subscriptions",()=>({snapshotFromPlan:(p:{id:string;displayName:string;priceVnd:number;durationDays:number|null;submissionLimit:number;features:string[]})=>({planId:p.id,planNameSnapshot:p.displayName,pricePaidVnd:0,durationDaysSnapshot:p.durationDays,submissionLimitSnapshot:p.submissionLimit,featureSnapshot:p.features}),grantSubscription:h.grant}));
vi.mock("@/lib/transactions",()=>({withSerializableRetry:async(fn:(tx:unknown)=>Promise<unknown>)=>fn({promoCode:{findUnique:h.promoFind},promoRedemption:{count:h.count,create:h.create}})}));
import { redeemPromo } from "@/lib/services/promo";

const base={id:"promo",code:"TEST",rewardType:"ADD_SUBMISSIONS",grantPlanId:null,grantDurationDays:null,addSubmissions:5,maxTotalRedemptions:10,redemptionLimitPerUser:1,expiresAt:null,isActive:true,activationBehavior:"QUEUE_AFTER_CURRENT",archivedAt:null,grantPlan:null};
beforeEach(()=>{h.promoFind.mockReset().mockResolvedValue(base);h.count.mockReset().mockResolvedValueOnce(0).mockResolvedValueOnce(0);h.create.mockReset().mockResolvedValue({id:"r"});h.add.mockReset().mockResolvedValue({id:"l"});h.grant.mockReset().mockResolvedValue({id:"s",status:"ACTIVE"});});

describe("promo codes",()=>{
  it("adds submissions without changing plan",async()=>{expect(await redeemPromo("u"," test ")).toEqual({type:"ADD_SUBMISSIONS",amount:5});expect(h.add).toHaveBeenCalledTimes(1);expect(h.grant).not.toHaveBeenCalled();});
  it("rejects an expired promo",async()=>{h.promoFind.mockResolvedValue({...base,expiresAt:new Date(Date.now()-1000)});await expect(redeemPromo("u","TEST")).rejects.toMatchObject({code:"PROMO_INVALID_OR_EXPIRED"});});
  it("enforces per-user redemption limits",async()=>{h.count.mockReset().mockResolvedValueOnce(0).mockResolvedValueOnce(1);await expect(redeemPromo("u","TEST")).rejects.toMatchObject({code:"PROMO_ALREADY_USED"});});
  it("enforces global redemption limits",async()=>{h.promoFind.mockResolvedValue({...base,maxTotalRedemptions:2});h.count.mockReset().mockResolvedValueOnce(2).mockResolvedValueOnce(0);await expect(redeemPromo("u","TEST")).rejects.toMatchObject({code:"PROMO_GLOBAL_LIMIT"});});
  it("grants a real subscription snapshot for GRANT_PLAN",async()=>{const plan={id:"pro",displayName:"Pro",priceVnd:50000,durationDays:30,submissionLimit:10,features:["BAND_SCORE"],isActive:true,visibility:"PUBLIC"};h.promoFind.mockResolvedValue({...base,rewardType:"GRANT_PLAN",addSubmissions:null,grantPlan:plan});await redeemPromo("u","TEST");expect(h.grant).toHaveBeenCalledWith(expect.anything(),"u",expect.objectContaining({planId:"pro",pricePaidVnd:0,submissionLimitSnapshot:10}),"PROMO","promo","QUEUE_AFTER_CURRENT");});
  it("does not grant an archived target plan",async()=>{const plan={id:"old",displayName:"Old",priceVnd:50000,durationDays:30,submissionLimit:10,features:[],isActive:false,visibility:"ARCHIVED"};h.promoFind.mockResolvedValue({...base,rewardType:"GRANT_PLAN",addSubmissions:null,grantPlan:plan});await expect(redeemPromo("u","TEST")).rejects.toMatchObject({code:"PROMO_PLAN_UNAVAILABLE"});expect(h.grant).not.toHaveBeenCalled();});
});
