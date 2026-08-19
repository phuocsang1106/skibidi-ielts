import { beforeEach, describe, expect, it, vi } from "vitest";
const h=vi.hoisted(()=>({findMany:vi.fn(),findUnique:vi.fn(),active:vi.fn(),free:vi.fn()}));
vi.mock("@/lib/db",()=>({prisma:{plan:{findMany:h.findMany,findUnique:h.findUnique}}}));
vi.mock("@/lib/services/subscriptions",()=>({getActiveSubscription:h.active,ensureFreeSubscription:h.free}));
import { getOperationalPlanForUser, listPublicPlans } from "@/lib/services/plans";

describe("dynamic plan policy",()=>{
  beforeEach(()=>{h.findMany.mockReset();h.findUnique.mockReset();h.active.mockReset();h.free.mockReset();});
  it("queries only public active plans for new purchases/pricing",async()=>{h.findMany.mockResolvedValue([]);await listPublicPlans();expect(h.findMany).toHaveBeenCalledWith(expect.objectContaining({where:{visibility:"PUBLIC",isActive:true}}));});
  it("returns an arbitrary admin-created public plan without a TypeScript plan-name branch",async()=>{h.findMany.mockResolvedValue([{id:"custom",slug:"custom-2026",displayName:"Custom",visibility:"PUBLIC",isActive:true}]);const plans=await listPublicPlans();expect(plans[0]?.slug).toBe("custom-2026");});
  it("retains operational access for an existing hidden-plan subscriber",async()=>{h.active.mockResolvedValue({planId:"hidden-plan",featureSnapshot:["BAND_SCORE"],planNameSnapshot:"Legacy Hidden"});h.findUnique.mockResolvedValue({id:"hidden-plan",visibility:"HIDDEN",isActive:true,aiConfig:null});const result=await getOperationalPlanForUser("u");expect(result.plan.visibility).toBe("HIDDEN");expect(result.features).toEqual(["BAND_SCORE"]);expect(h.free).not.toHaveBeenCalled();});
});
