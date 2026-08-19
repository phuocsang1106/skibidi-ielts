import { beforeEach, describe, expect, it, vi } from "vitest";
const h=vi.hoisted(()=>({grant:vi.fn(),audit:vi.fn(),orderFind:vi.fn(),orderUpdate:vi.fn()}));
vi.mock("@/lib/db",()=>({prisma:{}}));
vi.mock("@/lib/services/subscriptions",()=>({grantSubscription:h.grant}));
vi.mock("@/lib/services/audit",()=>({writeAudit:h.audit}));
vi.mock("@/lib/transactions",()=>({withSerializableRetry:async(fn:(tx:unknown)=>Promise<unknown>)=>fn({paymentOrder:{findUnique:h.orderFind,update:h.orderUpdate}})}));
import { approvePayment } from "@/lib/services/payments";

const reported={id:"o",userId:"u",planId:"p",status:"TRANSFER_REPORTED",amountVnd:50000,planNameSnapshot:"Pro",durationDaysSnapshot:30,submissionLimitSnapshot:10,featureSnapshot:["BAND_SCORE"]};
beforeEach(()=>{h.grant.mockReset().mockResolvedValue({id:"sub"});h.audit.mockReset();h.orderFind.mockReset().mockResolvedValue(reported);h.orderUpdate.mockReset().mockResolvedValue({...reported,status:"APPROVED"});});

describe("manual payment approval",()=>{
  it("grants exactly the commercial snapshot on explicit admin approval",async()=>{await approvePayment("admin","o");expect(h.grant).toHaveBeenCalledWith(expect.anything(),"u",{planId:"p",planNameSnapshot:"Pro",pricePaidVnd:50000,durationDaysSnapshot:30,submissionLimitSnapshot:10,featureSnapshot:["BAND_SCORE"]},"PURCHASE","o","SAFE_DEFAULT");expect(h.orderUpdate).toHaveBeenCalledTimes(1);});
  it("is idempotent when the order is already approved",async()=>{h.orderFind.mockResolvedValue({...reported,status:"APPROVED"});await approvePayment("admin","o");expect(h.grant).not.toHaveBeenCalled();expect(h.orderUpdate).not.toHaveBeenCalled();});
});
