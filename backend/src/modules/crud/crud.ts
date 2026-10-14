import { reorderSchema } from "@portfolio/shared";
import { asc, desc, eq, inArray, max } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import type { Router } from "express";
import type { z } from "zod";
import type { AppContext } from "../../context.js";
import type { Executor } from "../../db/client.js";
import { badRequest, conflict, notFound } from "../../middleware/error.js";
import { parseBody, parseId } from "../../middleware/validate.js";
import { assertMedia, loadMedia, mediaDto, releaseMedia } from "../media/service.js";

export type Row = Record<string, unknown> & { id: number };

export interface CrudConfig<S extends z.ZodObject> {
  /** Mount path on the admin router, e.g. "/projects". */
  path: string;
  table: PgTable;
  /** Without sortOrder the list is newest-first and there is no reorder route. */
  columns: { id: PgColumn; sortOrder?: PgColumn };
  schema: S;
  /** Media FK columns → key of the expanded media object in the admin DTO. */
  mediaFields?: Record<string, string>;
  /** Derived fields. Runs on create and update (existing is set on update). */
  prepare?: (values: Record<string, unknown>, existing: Row | null) => Record<string, unknown>;
  /** Extra media ids owned by a row (gallery images, embedded images) — for orphan cleanup. */
  extraMediaIds?: (db: Executor, id: number) => Promise<number[]>;
  /** Side effects after a write, inside the same transaction. */
  afterWrite?: (tx: Executor, row: Row) => Promise<void>;
  /** Extra fields in the admin DTO. */
  decorate?: (db: Executor, rows: Row[]) => Promise<Row[]>;
}

const PG_UNIQUE_VIOLATION = "23505";

/** Drizzle wraps driver errors; look through `cause`. */
export function isUniqueViolation(err: unknown): boolean {
  for (let e: unknown = err; e && typeof e === "object"; e = (e as { cause?: unknown }).cause) {
    if ((e as { code?: unknown }).code === PG_UNIQUE_VIOLATION) return true;
  }
  return false;
}

// Drizzle's query builder can't be typed over an arbitrary table, so rows are
// handled as `Row` here and each module's zod schema guards the input shape.
export function createCrud<S extends z.ZodObject>(ctx: AppContext, config: CrudConfig<S>) {
  const { db } = ctx;
  const { table, columns } = config;
  const mediaFields = config.mediaFields ?? {};
  const updateSchema = config.schema.partial();

  const getRow = async (id: number): Promise<Row | undefined> => {
    const [row] = await db.select().from(table).where(eq(columns.id, id));
    return row as Row | undefined;
  };

  const ownedMedia = async (row: Row): Promise<number[]> =>
    [
      ...Object.keys(mediaFields).map((k) => row[k] as number | null),
      ...((await config.extraMediaIds?.(db, row.id)) ?? []),
    ].filter((v): v is number => typeof v === "number");

  const toDto = async (rows: Row[]): Promise<Row[]> => {
    const decorated = config.decorate ? await config.decorate(db, rows) : rows;
    const mediaById = await loadMedia(
      db,
      decorated.flatMap((r) => Object.keys(mediaFields).map((k) => r[k] as number | null)),
    );
    return decorated.map((r) => {
      const out: Row = { ...r };
      for (const [col, key] of Object.entries(mediaFields)) {
        const m = mediaById.get(r[col] as number);
        out[key] = m ? mediaDto(m) : null;
      }
      return out;
    });
  };

  const one = async (row: Row) => (await toDto([row]))[0]!;

  const checkMedia = async (values: Record<string, unknown>) => {
    for (const col of Object.keys(mediaFields)) {
      await assertMedia(db, values[col] as number | null | undefined);
    }
  };

  const write = async <T>(fn: (tx: Executor) => Promise<T>): Promise<T> => {
    try {
      return await db.transaction(fn);
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw conflict("A record with the same unique value already exists");
      }
      throw err;
    }
  };

  const crud = {
    getRow,
    toDto,

    async list(): Promise<Row[]> {
      const order = columns.sortOrder
        ? [asc(columns.sortOrder), asc(columns.id)]
        : [desc(columns.id)];
      return toDto(
        (await db
          .select()
          .from(table)
          .orderBy(...order)) as Row[],
      );
    },

    async get(id: number): Promise<Row> {
      const row = await getRow(id);
      if (!row) throw notFound();
      return one(row);
    },

    async create(input: z.infer<S>): Promise<Row> {
      const values = config.prepare ? config.prepare({ ...input }, null) : { ...input };
      await checkMedia(values);
      const row = await write(async (tx) => {
        const sort = columns.sortOrder;
        if (sort) {
          const [agg] = await tx.select({ v: max(sort) }).from(table);
          values.sortOrder = ((agg?.v as number | null) ?? -1) + 1;
        }
        const [inserted] = (await tx.insert(table).values(values).returning()) as Row[];
        await config.afterWrite?.(tx, inserted!);
        return inserted!;
      });
      return one(row);
    },

    async update(id: number, input: Partial<z.infer<S>>): Promise<Row> {
      const existing = await getRow(id);
      if (!existing) throw notFound();
      const before = await ownedMedia(existing);
      const values = config.prepare ? config.prepare({ ...input }, existing) : { ...input };
      await checkMedia(values);
      const row = await write(async (tx) => {
        const [updated] = (await tx
          .update(table)
          .set(values)
          .where(eq(columns.id, id))
          .returning()) as Row[];
        await config.afterWrite?.(tx, updated!);
        return updated!;
      });
      await releaseMedia(ctx, before);
      return one(row);
    },

    async remove(id: number): Promise<void> {
      const existing = await getRow(id);
      if (!existing) throw notFound();
      const owned = await ownedMedia(existing);
      await write((tx) => tx.delete(table).where(eq(columns.id, id)));
      await releaseMedia(ctx, owned);
    },

    async reorder(ids: number[]): Promise<void> {
      const sort = columns.sortOrder;
      if (!sort) throw badRequest("This resource has no manual order");
      if (new Set(ids).size !== ids.length) throw badRequest("Duplicate ids");
      await write(async (tx) => {
        const found = await tx
          .select({ id: columns.id })
          .from(table)
          .where(inArray(columns.id, ids));
        if (found.length !== ids.length) throw badRequest("Unknown id in reorder list");
        for (const [index, id] of ids.entries()) {
          await tx.update(table).set({ sortOrder: index }).where(eq(columns.id, id));
        }
      });
    },

    /** Register the standard admin routes. */
    register(router: Router): void {
      const p = config.path;
      router.get(p, async (_req, res) => {
        res.json({ items: await crud.list() });
      });
      router.post(p, async (req, res) => {
        res.status(201).json(await crud.create(parseBody(config.schema, req)));
      });
      // Before "/:id" so "reorder" is not parsed as an id.
      if (columns.sortOrder) {
        router.patch(`${p}/reorder`, async (req, res) => {
          await crud.reorder(parseBody(reorderSchema, req).ids);
          res.status(204).end();
        });
      }
      router.get(`${p}/:id`, async (req, res) => {
        res.json(await crud.get(parseId(req)));
      });
      router.patch(`${p}/:id`, async (req, res) => {
        const input = parseBody(updateSchema, req) as Partial<z.infer<S>>;
        res.json(await crud.update(parseId(req), input));
      });
      router.delete(`${p}/:id`, async (req, res) => {
        await crud.remove(parseId(req));
        res.status(204).end();
      });
    },
  };
  return crud;
}
