import { beforeEach, describe, expect, it, vi } from "vitest";

const h=vi.hoisted(()=>({
  cookieGet:vi.fn(),cookieSet:vi.fn(),sessionFind:vi.fn(),sessionDelete:vi.fn(),redirect:vi.fn(),
  userFind:vi.fn(),planFind:vi.fn(),txUserCreate:vi.fn(),txSubCreate:vi.fn(),createSession:vi.fn(),
  compare:vi.fn(),hash:vi.fn(),loginAllowed:vi.fn(),loginFailure:vi.fn(),loginClear:vi.fn()
}));
vi.mock("server-only",()=>({}));
vi.mock("next/headers",()=>({cookies:async()=>({get:h.cookieGet,set:h.cookieSet})}));
vi.mock("next/navigation",()=>({redirect:h.redirect}));
vi.mock("@/lib/db",()=>({prisma:{session:{findUnique:h.sessionFind,delete:h.sessionDelete,create:vi.fn(),deleteMany:vi.fn()},user:{findUnique:h.userFind},plan:{findFirst:h.planFind},$transaction:async(fn:(tx:unknown)=>Promise<unknown>)=>fn({user:{create:h.txUserCreate},subscription:{create:h.txSubCreate}})}}));
vi.mock("bcryptjs",()=>({compare:h.compare,hash:h.hash}));
vi.mock("@/lib/rate-limit",()=>({assertLoginAllowed:h.loginAllowed,recordLoginFailure:h.loginFailure,clearLoginFailures:h.loginClear}));

import { getCurrentUser, requireAdmin } from "@/lib/auth";

function post(url:string,data:Record<string,string>){return new Request(url,{method:"POST",headers:{origin:"http://localhost:3000","sec-fetch-site":"same-origin","content-type":"application/x-www-form-urlencoded"},body:new URLSearchParams(data)});}

beforeEach(()=>{
  process.env.APP_URL="http://localhost:3000";
  h.cookieGet.mockReset();h.cookieSet.mockReset();h.sessionFind.mockReset();h.sessionDelete.mockReset();h.redirect.mockReset().mockImplementation((url:string)=>{throw new Error(`REDIRECT:${url}`);});
  h.userFind.mockReset();h.planFind.mockReset();h.txUserCreate.mockReset();h.txSubCreate.mockReset();h.createSession.mockReset();h.compare.mockReset();h.hash.mockReset();h.loginAllowed.mockReset();h.loginFailure.mockReset();h.loginClear.mockReset();
});

describe("session authorization",()=>{
  it("returns the user only for a valid unexpired opaque session",async()=>{h.cookieGet.mockReturnValue({value:"raw-token"});h.sessionFind.mockResolvedValue({id:"s",expiresAt:new Date(Date.now()+60000),user:{id:"u",username:"alice",normalizedUsername:"alice",role:"USER",bonusSubmissionBalance:0}});expect((await getCurrentUser())?.username).toBe("alice");});
  it("protects admin routes from normal users",async()=>{h.cookieGet.mockReturnValue({value:"raw-token"});h.sessionFind.mockResolvedValue({id:"s",expiresAt:new Date(Date.now()+60000),user:{id:"u",username:"alice",normalizedUsername:"alice",role:"USER",bonusSubmissionBalance:0}});await expect(requireAdmin()).rejects.toThrow("REDIRECT:/app/dashboard");});
});

describe("login route",()=>{
  it("logs in a valid user and redirects to the app",async()=>{
    h.userFind.mockResolvedValue({id:"u",username:"alice",normalizedUsername:"alice",passwordHash:"hash",role:"USER"});h.compare.mockResolvedValue(true);
    const {POST}=await import("@/app/api/auth/login/route");const response=await POST(post("http://localhost:3000/api/auth/login",{username:"alice",password:"correct-password"}));expect(response.status).toBe(303);expect(response.headers.get("location")).toContain("/app/dashboard");
  });
});

describe("registration route",()=>{
  it("creates a user plus a snapshotted free subscription",async()=>{
    h.planFind.mockResolvedValue({id:"free",displayName:"Free",priceVnd:0,durationDays:null,submissionLimit:1,features:["BAND_SCORE"]});h.hash.mockResolvedValue("hashed");h.txUserCreate.mockResolvedValue({id:"u",username:"newuser"});h.txSubCreate.mockResolvedValue({id:"sub"});
    const {POST}=await import("@/app/api/auth/register/route");const response=await POST(post("http://localhost:3000/api/auth/register",{username:"newuser",password:"password123",confirmPassword:"password123"}));expect(response.status).toBe(303);expect(h.txSubCreate).toHaveBeenCalledWith({data:expect.objectContaining({userId:"u",planId:"free",planNameSnapshot:"Free",submissionLimitSnapshot:1,remainingPlanSubmissions:1,source:"FREE"})});
  });
});
