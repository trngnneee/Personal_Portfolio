import type { Request } from "express";

export type ClientIp = (req: Request) => string;

/**
 * Resolves the real client IP. Behind Cloudflare → Render, `req.ip` is a rotating Cloudflare egress
 * address, so production names a header the edge overwrites on every request (`cf-connecting-ip`).
 * Only configure a header that the outermost proxy always sets — otherwise clients can spoof it.
 */
export function createClientIp(header: string): ClientIp {
  if (!header) return (req) => req.ip ?? "";
  return (req) => req.get(header)?.split(",")[0]?.trim() || req.ip || "";
}
