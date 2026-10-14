import { messageListQuerySchema, messagePatchSchema } from "@portfolio/shared";
import { desc, eq } from "drizzle-orm";
import type { Router } from "express";
import type { AppContext } from "../../context.js";
import { contactMessages } from "../../db/schema.js";
import { notFound } from "../../middleware/error.js";
import { parseBody, parseId, parseQuery } from "../../middleware/validate.js";

type MessageRow = typeof contactMessages.$inferSelect;

// ip_hash stays server-side even for the admin.
const toDto = ({ ipHash: _ipHash, ...rest }: MessageRow) => rest;

export function registerMessages({ db }: AppContext, router: Router): void {
  router.get("/messages", async (req, res) => {
    const { status } = parseQuery(messageListQuerySchema, req);
    const rows = await db
      .select()
      .from(contactMessages)
      .where(status ? eq(contactMessages.status, status) : undefined)
      .orderBy(desc(contactMessages.id));
    res.json({ items: rows.map(toDto) });
  });

  router.get("/messages/:id", async (req, res) => {
    const [row] = await db
      .select()
      .from(contactMessages)
      .where(eq(contactMessages.id, parseId(req)));
    if (!row) throw notFound();
    res.json(toDto(row));
  });

  router.patch("/messages/:id", async (req, res) => {
    const { status } = parseBody(messagePatchSchema, req);
    const [row] = await db
      .update(contactMessages)
      .set({ status })
      .where(eq(contactMessages.id, parseId(req)))
      .returning();
    if (!row) throw notFound();
    res.json(toDto(row));
  });

  router.delete("/messages/:id", async (req, res) => {
    const removed = await db
      .delete(contactMessages)
      .where(eq(contactMessages.id, parseId(req)))
      .returning({ id: contactMessages.id });
    if (removed.length === 0) throw notFound();
    res.status(204).end();
  });
}
