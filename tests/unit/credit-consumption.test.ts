import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/db",()=>({prisma:{}}));
import { consumeExactlyOneCredit } from "@/lib/services/credits";

type FakeTx = {
  submissionCreditLedger:{findUnique:ReturnType<typeof vi.fn>;create:ReturnType<typeof vi.fn>};
  subscription:{findFirst:ReturnType<typeof vi.fn>;updateMany:ReturnType<typeof vi.fn>;findUniqueOrThrow:ReturnType<typeof vi.fn>};
  user:{updateMany:ReturnType<typeof vi.fn>;findUniqueOrThrow:ReturnType<typeof vi.fn>};
};
function fake():FakeTx{return {submissionCreditLedger:{findUnique:vi.fn().mockResolvedValue(null),create:vi.fn(async({data}:{data:unknown})=>data)},subscription:{findFirst:vi.fn().mockResolvedValue({id:"s",remainingPlanSubmissions:3}),updateMany:vi.fn().mockResolvedValue({count:1}),findUniqueOrThrow:vi.fn().mockResolvedValue({remainingPlanSubmissions:2})},user:{updateMany:vi.fn().mockResolvedValue({count:1}),findUniqueOrThrow:vi.fn().mockResolvedValue({bonusSubmissionBalance:4})}};}

describe("submission credit accounting",()=>{
  it("consumes exactly one plan credit and does not touch bonus",async()=>{const tx=fake();const ledger=await consumeExactlyOneCredit(tx as never,"u","writing-1");expect(tx.subscription.updateMany).toHaveBeenCalledTimes(1);expect(tx.user.updateMany).not.toHaveBeenCalled();expect(ledger).toMatchObject({bucket:"PLAN",delta:-1,balanceAfter:2,submissionId:"writing-1"});});
  it("falls back to bonus only when plan quota cannot be consumed",async()=>{const tx=fake();tx.subscription.updateMany.mockResolvedValue({count:0});const ledger=await consumeExactlyOneCredit(tx as never,"u","writing-2");expect(tx.user.updateMany).toHaveBeenCalledTimes(1);expect(ledger).toMatchObject({bucket:"BONUS",delta:-1,balanceAfter:4});});
  it("is idempotent for a persisted submission ID",async()=>{const tx=fake();const existing={id:"ledger-existing",submissionId:"writing-3"};tx.submissionCreditLedger.findUnique.mockResolvedValue(existing);expect(await consumeExactlyOneCredit(tx as never,"u","writing-3")).toBe(existing);expect(tx.subscription.updateMany).not.toHaveBeenCalled();expect(tx.user.updateMany).not.toHaveBeenCalled();});
});
