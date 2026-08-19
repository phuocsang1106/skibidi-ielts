import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function keyedSha256(value: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET must contain at least 32 characters");
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}


export function publicAppUrl(path: string, request?: Request) {
  const base = process.env.APP_URL || request?.url;
  if (!base) throw new Error("APP_URL is required to build public URLs");
  return new URL(path, base);
}

export function requestIp(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}

export function assertSameOrigin(request: Request) {
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite && !["same-origin", "same-site", "none"].includes(secFetchSite)) {
    throw new Error("CSRF_ORIGIN_MISMATCH");
  }
  const origin = request.headers.get("origin");
  if (!origin) return;
  const expected = new URL(process.env.APP_URL || request.url).origin;
  if (origin !== expected) throw new Error("CSRF_ORIGIN_MISMATCH");
}
