import { SECTION_KEYS, sectionPatchSchema, sectionReorderSchema } from "@portfolio/shared";
import type { Router } from "express";
import { z } from "zod";
import type { AppContext } from "../../context.js";
import { parseBody } from "../../middleware/validate.js";
import { listSections, patchSection, reorderSections } from "./service.js";

const keyParam = z.object({ key: z.enum(SECTION_KEYS) });

export function registerSections({ db }: AppContext, router: Router): void {
  router.get("/sections", async (_req, res) => {
    res.json({ items: await listSections(db) });
  });
  router.patch("/sections/reorder", async (req, res) => {
    await reorderSections(db, parseBody(sectionReorderSchema, req).keys);
    res.json({ items: await listSections(db) });
  });
  router.patch("/sections/:key", async (req, res) => {
    const { key } = keyParam.parse(req.params);
    res.json(await patchSection(db, key, parseBody(sectionPatchSchema, req)));
  });
}
