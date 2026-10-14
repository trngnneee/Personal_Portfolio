import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import type { ClientIp } from "../lib/client-ip.js";

const FIFTEEN_MIN = 15 * 60 * 1000;

const limited = (limit: number, clientIp: ClientIp) =>
  rateLimit({
    windowMs: FIFTEEN_MIN,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    // Key on the real client (see lib/client-ip.ts); IPv6 is bucketed per /56 like the default.
    keyGenerator: (req) => ipKeyGenerator(clientIp(req)),
    handler: (_req, res) => {
      res
        .status(429)
        .json({ error: { code: "rate_limited", message: "Too many requests, try again later" } });
    },
  });

// Factories so each app instance (and each test) gets its own counters.
export const createLoginLimiter = (clientIp: ClientIp) => limited(10, clientIp);
export const createContactLimiter = (clientIp: ClientIp) => limited(5, clientIp);
