import type { MediaResourceType } from "@portfolio/shared";

export interface DetectedFile {
  extension: "jpg" | "png" | "webp" | "avif" | "pdf";
  resourceType: MediaResourceType;
  maxBytes: number;
}

const MB = 1024 * 1024;
const image = (extension: DetectedFile["extension"]): DetectedFile => ({
  extension,
  resourceType: "image",
  maxBytes: 8 * MB,
});

/** Sniff magic bytes — never trust the client's Content-Type. */
export function detectFileType(buf: Buffer): DetectedFile | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return image("jpg");
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return image("png");
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP")
    return image("webp");
  if (buf.toString("ascii", 4, 8) === "ftyp" && /^avi[fs]$/.test(buf.toString("ascii", 8, 12)))
    return image("avif");
  if (buf.toString("ascii", 0, 5) === "%PDF-")
    return { extension: "pdf", resourceType: "raw", maxBytes: 10 * MB };
  return null;
}

/** Pixel size from PNG/JPEG headers (no decoding). Null when unknown. */
export function imageSize(buf: Buffer): { width: number; height: number } | null {
  // PNG: IHDR is always first.
  if (buf.length >= 24 && buf[0] === 0x89 && buf.toString("ascii", 12, 16) === "IHDR") {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  // JPEG: walk segments to the first SOFn marker.
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) return null;
      const marker = buf[i + 1]!;
      const length = buf.readUInt16BE(i + 2);
      const isSof = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
      if (isSof) return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      i += 2 + length;
    }
  }
  return null;
}
