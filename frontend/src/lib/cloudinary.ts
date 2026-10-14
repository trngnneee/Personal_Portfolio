const CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ?? "";
const UPLOAD_SEGMENT = "/image/upload/";

export interface CldOptions {
  w?: number;
  h?: number;
  /** Cloudinary crop mode when both w and h are set. */
  crop?: "fill" | "fit" | "limit";
}

const isUrl = (v: string) => /^https?:\/\//.test(v);
const isCloudinary = (url: string) =>
  url.includes("res.cloudinary.com/") && url.includes(UPLOAD_SEGMENT);

function transformation({ w, h, crop }: CldOptions): string {
  const parts = ["f_auto", "q_auto"];
  if (w) parts.push(`w_${Math.round(w)}`);
  if (h) parts.push(`h_${Math.round(h)}`);
  parts.push(`c_${crop ?? (w && h ? "fill" : "limit")}`);
  return parts.join(",");
}

/**
 * Responsive delivery URL for a Cloudinary public id or delivery URL.
 * Non-Cloudinary URLs (e.g. dev seed assets) are returned untouched.
 */
export function cld(source: string, options: CldOptions = {}): string {
  if (!isUrl(source)) {
    if (!CLOUD) return source;
    return `https://res.cloudinary.com/${CLOUD}/image/upload/${transformation(options)}/${source}`;
  }
  if (!isCloudinary(source)) return source;
  const [head, tail] = source.split(UPLOAD_SEGMENT) as [string, string];
  return `${head}${UPLOAD_SEGMENT}${transformation(options)}/${tail}`;
}

/** `srcset` for the given widths, or undefined when the source can't be resized. */
export function cldSrcSet(source: string, widths: number[], aspect?: number): string | undefined {
  if (isUrl(source) && !isCloudinary(source)) return undefined;
  if (!isUrl(source) && !CLOUD) return undefined;
  return widths
    .map((w) => `${cld(source, { w, h: aspect ? w / aspect : undefined })} ${w}w`)
    .join(", ");
}
