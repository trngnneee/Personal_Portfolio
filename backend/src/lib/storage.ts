import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { MediaResourceType } from "@portfolio/shared";
import { imageSize } from "./file-type.js";

export interface StoredFile {
  publicId: string;
  url: string;
  format: string | null;
  width: number | null;
  height: number | null;
  bytes: number;
}

export interface UploadOptions {
  folder: string;
  resourceType: MediaResourceType;
  /** Fixed public id (seed). Re-uploading the same id is a no-op. */
  publicId?: string;
  extension: string;
}

/** Where media bytes live. Cloudinary in prod; disk in local dev; a fake in tests. */
export interface MediaStorage {
  upload(data: Buffer | string, options: UploadOptions): Promise<StoredFile>;
  destroy(publicId: string, resourceType: MediaResourceType): Promise<void>;
}

const LOCAL_NAME = /^[0-9a-f-]{36}\.[a-z0-9]{2,5}$/;

/** Dev-only fallback when Cloudinary isn't configured. Files are served at /uploads. */
export function createLocalStorage(dir: string, baseUrl: string): MediaStorage {
  return {
    async upload(data, options) {
      if (typeof data === "string") throw new Error("Local storage cannot fetch remote URLs");
      const name = `${randomUUID()}.${options.extension}`;
      await mkdir(dir, { recursive: true });
      await writeFile(join(dir, name), data);
      const size = imageSize(data);
      return {
        publicId: `local/${name}`,
        url: `${baseUrl}/uploads/${name}`,
        format: options.extension,
        width: size?.width ?? null,
        height: size?.height ?? null,
        bytes: data.length,
      };
    },
    async destroy(publicId) {
      if (!publicId.startsWith("local/")) return;
      // Only ever delete files this adapter created: "<uuid>.<ext>", no path parts.
      const name = publicId.slice("local/".length);
      if (!LOCAL_NAME.test(name))
        throw new Error(`Refusing to delete unexpected path: ${publicId}`);
      await rm(join(dir, name), { force: true });
    },
  };
}
