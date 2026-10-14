import { z } from "zod";

/** Optional free text: "" and null both become null. */
export const optText = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.string().trim().max(max).nullable(),
  );

export const optUrl = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? null : v),
  z
    .url({ protocol: /^https?$/ })
    .max(2048)
    .nullable(),
);

/** YYYY-MM or YYYY-MM-DD. */
export const partialDate = z
  .string()
  .regex(/^\d{4}-\d{2}(-\d{2})?$/, "Expected YYYY-MM or YYYY-MM-DD");
export const optDate = z.preprocess((v) => (v === "" ? null : v), partialDate.nullable());

export const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Expected #RRGGBB");

export const mediaId = z.number().int().positive().nullable();

export const stringList = (maxItems: number, maxLen: number) =>
  z.array(z.string().trim().min(1).max(maxLen)).max(maxItems);

// Digits only: rejects "0x1", "1e3", " 1", "-1" that Number() would accept.
export const idParamSchema = z.object({
  id: z
    .string()
    .regex(/^[1-9]\d{0,9}$/, "Expected a positive integer id")
    .transform(Number)
    .pipe(z.number().int().max(2_147_483_647)),
});

export const reorderSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1).max(500),
});
export type ReorderInput = z.infer<typeof reorderSchema>;

export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, digits and single dashes only");
