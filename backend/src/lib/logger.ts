import { pino } from "pino";

const isDev = process.env.NODE_ENV === "development";

export const logger = pino({
  level: process.env.NODE_ENV === "test" ? "silent" : (process.env.LOG_LEVEL ?? "info"),
  redact: {
    paths: ["req.headers.authorization", "*.password", "*.currentPassword", "*.newPassword"],
    censor: "[redacted]",
  },
  ...(isDev ? { transport: { target: "pino-pretty", options: { colorize: true } } } : {}),
});
