import type { PublicMedia } from "@portfolio/shared";
import { cld, cldSrcSet } from "@/lib/cloudinary";

interface ImageProps {
  media: PublicMedia;
  /** Rendered width hint for the default src. */
  width: number;
  /** Crop to this aspect ratio (w/h). Omit to keep the original ratio. */
  aspect?: number;
  sizes?: string;
  className?: string;
  /** Above-the-fold images: eager + high priority. */
  priority?: boolean;
  alt?: string;
}

const WIDTHS = [320, 480, 640, 960, 1280, 1920];

export function Image({
  media,
  width,
  aspect,
  sizes = "100vw",
  className,
  priority,
  alt,
}: ImageProps) {
  const ratio = aspect ?? (media.width && media.height ? media.width / media.height : 16 / 9);
  const widths = WIDTHS.filter((w) => w <= Math.max(width * 2, 320));
  return (
    <img
      src={cld(media.url, { w: width, h: aspect ? width / aspect : undefined })}
      srcSet={cldSrcSet(media.url, widths, aspect)}
      sizes={sizes}
      width={width}
      height={Math.round(width / ratio)}
      alt={alt ?? media.alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      className={className}
    />
  );
}
