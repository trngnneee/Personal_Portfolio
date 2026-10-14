import { describe, expect, it } from "vitest";
import { LOCKED_SECTIONS, SECTION_DEFAULTS, SECTION_KEYS } from "../src/sections.js";

describe("sections", () => {
  it("has a default for every key, in a unique order", () => {
    expect(SECTION_DEFAULTS.map((s) => s.key).sort()).toEqual([...SECTION_KEYS].sort());
  });

  it("keeps locked sections enabled and blog disabled by default", () => {
    for (const key of LOCKED_SECTIONS) {
      expect(SECTION_DEFAULTS.find((s) => s.key === key)?.enabled).toBe(true);
    }
    expect(SECTION_DEFAULTS.find((s) => s.key === "blog")?.enabled).toBe(false);
  });
});
