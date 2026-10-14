import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import type { MediaStorage } from "./storage.js";

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

export function createCloudinaryStorage(config: CloudinaryConfig): MediaStorage {
  cloudinary.config({
    cloud_name: config.cloudName,
    api_key: config.apiKey,
    api_secret: config.apiSecret,
    secure: true,
  });

  return {
    async upload(data, options) {
      const params = {
        folder: options.publicId ? undefined : options.folder,
        public_id: options.publicId,
        overwrite: false,
        resource_type: options.resourceType,
        // Raw files need the extension in the public id to be served with it.
        ...(options.resourceType === "raw" && options.publicId
          ? { public_id: `${options.publicId}.${options.extension}` }
          : {}),
      };

      const res: UploadApiResponse =
        typeof data === "string"
          ? await cloudinary.uploader.upload(data, params)
          : await new Promise((resolve, reject) => {
              const stream = cloudinary.uploader.upload_stream(params, (err, result) => {
                if (err || !result) reject(err ?? new Error("Empty Cloudinary response"));
                else resolve(result);
              });
              stream.end(data);
            });

      return {
        publicId: res.public_id,
        url: res.secure_url,
        format: res.format ?? options.extension,
        width: res.width ?? null,
        height: res.height ?? null,
        bytes: res.bytes,
      };
    },

    async destroy(publicId, resourceType) {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
        invalidate: true,
      });
    },
  };
}
