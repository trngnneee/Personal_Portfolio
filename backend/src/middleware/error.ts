import type { ErrorRequestHandler, RequestHandler } from "express";
import multer from "multer";
import { ZodError } from "zod";
import { logger } from "../lib/logger.js";

export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new AppError(400, "bad_request", message, details);
export const unauthorized = (message = "Unauthorized") =>
  new AppError(401, "unauthorized", message);
export const notFound = (message = "Not found") => new AppError(404, "not_found", message);
export const conflict = (message: string, details?: unknown) =>
  new AppError(409, "conflict", message, details);

export const notFoundHandler: RequestHandler = (_req, _res, next) =>
  next(notFound("Route not found"));

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: { code: "validation_error", message: "Invalid input", details: err.issues },
    });
    return;
  }
  if (err instanceof AppError) {
    res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }
  if (err instanceof multer.MulterError) {
    const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    res.status(status).json({ error: { code: err.code.toLowerCase(), message: err.message } });
    return;
  }
  // body-parser errors (malformed JSON, too large) carry a status.
  const status = typeof err?.status === "number" && err.status < 500 ? err.status : 500;
  if (status === 500) logger.error({ err }, "Unhandled error");
  res.status(status).json({
    error: {
      code: status === 500 ? "internal_error" : "bad_request",
      message: status === 500 ? "Internal server error" : String(err?.message ?? "Bad request"),
    },
  });
};
