import { profileSchema } from "@portfolio/shared";
import type { Router } from "express";
import type { AppContext } from "../../context.js";
import { notFound } from "../../middleware/error.js";
import { parseBody } from "../../middleware/validate.js";
import { assertMedia, loadMedia, mediaDto, releaseMedia } from "../media/service.js";
import { getProfile, upsertProfile, type ProfileRow } from "./service.js";

export function registerProfile(ctx: AppContext, router: Router): void {
  const { db } = ctx;

  const toDto = async (row: ProfileRow) => {
    const m = await loadMedia(db, [row.avatarMediaId, row.cvMediaId]);
    const pick = (id: number | null) => {
      const found = id == null ? undefined : m.get(id);
      return found ? mediaDto(found) : null;
    };
    return { ...row, avatar: pick(row.avatarMediaId), cv: pick(row.cvMediaId) };
  };

  router.get("/profile", async (_req, res) => {
    const row = await getProfile(db);
    if (!row) throw notFound("Profile not created yet");
    res.json(await toDto(row));
  });

  router.put("/profile", async (req, res) => {
    const input = parseBody(profileSchema, req);
    await assertMedia(db, input.avatarMediaId, "image");
    await assertMedia(db, input.cvMediaId, "raw");
    const before = await getProfile(db);
    const row = await upsertProfile(db, input);
    await releaseMedia(ctx, [before?.avatarMediaId, before?.cvMediaId]);
    res.json(await toDto(row));
  });
}
