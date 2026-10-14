import type { Request } from "express";
import type { z } from "zod";
import { idParamSchema } from "@portfolio/shared";

// Parse helpers throw ZodError → 400 via errorHandler.
export const parseBody = <S extends z.ZodType>(schema: S, req: Request): z.infer<S> =>
  schema.parse(req.body ?? {});
export const parseQuery = <S extends z.ZodType>(schema: S, req: Request): z.infer<S> =>
  schema.parse(req.query);
export const parseId = (req: Request, name = "id"): number =>
  idParamSchema.parse({ id: req.params[name] }).id;
