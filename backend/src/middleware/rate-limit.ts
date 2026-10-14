import { rateLimit } from "express-rate-limit";

const FIFTEEN_MIN = 15 * 60 * 1000;

const limited = (limit: number) =>
  rateLimit({
    windowMs: FIFTEEN_MIN,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_req, res) => {
      res
        .status(429)
        .json({ error: { code: "rate_limited", message: "Too many requests, try again later" } });
    },
  });

// Factories so each app instance (and each test) gets its own counters.
export const createLoginLimiter = () => limited(10);
export const createContactLimiter = () => limited(5);
