import { describe, expect, it } from "vitest";
import { assertSameOrigin } from "@/lib/security";

describe("same-origin mutation guard",()=>{
  it("accepts same-origin POSTs",()=>{process.env.APP_URL="https://example.com";const r=new Request("https://example.com/api/x",{method:"POST",headers:{origin:"https://example.com","sec-fetch-site":"same-origin"}});expect(()=>assertSameOrigin(r)).not.toThrow();});
  it("rejects cross-site requests",()=>{process.env.APP_URL="https://example.com";const r=new Request("https://example.com/api/x",{method:"POST",headers:{origin:"https://evil.example","sec-fetch-site":"cross-site"}});expect(()=>assertSameOrigin(r)).toThrow("CSRF_ORIGIN_MISMATCH");});
});
