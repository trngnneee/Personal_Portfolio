import type { TFunction } from "i18next";
import type { z } from "zod";

/**
 * Map a zod result to `{ field: message }`, translated. The admin form contract (doc §13)
 * stays the same: errors are derived every render and only shown after a failed submit.
 */
export function fieldErrors(
  result: z.ZodSafeParseResult<unknown>,
  t: TFunction,
): Record<string, string> {
  if (result.success) return {};
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const field = String(issue.path[0] ?? "_");
    if (errors[field]) continue;
    errors[field] = message(issue, t);
  }
  return errors;
}

function message(issue: z.core.$ZodIssue, t: TFunction): string {
  switch (issue.code) {
    case "too_small":
      return Number(issue.minimum) <= 1 && issue.origin === "string"
        ? t("validation.required")
        : t("validation.tooShort", { min: Number(issue.minimum) });
    case "too_big":
      return t("validation.tooLong", { max: Number(issue.maximum) });
    case "invalid_format":
      if (issue.format === "email") return t("validation.email");
      if (issue.format === "url") return t("validation.url");
      return t("validation.format");
    case "invalid_type":
      return t("validation.required");
    case "invalid_value":
      return t("validation.choose");
    default:
      return issue.message;
  }
}

/** Status prop for an Astryx field: only once errors are revealed. */
export const statusFor = (show: boolean, error: string | undefined) =>
  show && error ? ({ type: "error", message: error } as const) : undefined;

/** "a\nb\n\nc" → ["a", "b", "c"] for one-item-per-line inputs. */
export const lines = (value: string) =>
  value
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

/** "" → null for optional text fields. */
export const orNull = (value: string) => (value.trim() === "" ? null : value.trim());
