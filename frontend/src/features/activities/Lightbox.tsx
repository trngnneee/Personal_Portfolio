import type { PublicMedia } from "@portfolio/shared";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { KeyboardEvent } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Image } from "@/components/ui/Image";

interface LightboxProps {
  title: string;
  images: PublicMedia[];
  index: number | null;
  onIndexChange: (index: number | null) => void;
}

export function Lightbox({ title, images, index, onIndexChange }: LightboxProps) {
  const image = index === null ? null : images[index];
  const go = (delta: number) =>
    index !== null && onIndexChange((index + delta + images.length) % images.length);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") go(1);
    if (e.key === "ArrowLeft") go(-1);
  };

  return (
    <Dialog
      open={image != null}
      onClose={() => onIndexChange(null)}
      title={title}
      className="w-[min(72rem,calc(100vw-2rem))]"
    >
      {image && index !== null && (
        <figure onKeyDown={onKeyDown}>
          <Image
            media={image}
            width={1440}
            sizes="(min-width: 1200px) 1100px, 100vw"
            className="max-h-[70dvh] w-full rounded-md object-contain"
          />
          <figcaption className="mt-3 flex items-center justify-between gap-4 font-mono text-sm text-neutral-300">
            <span>{image.alt}</span>
            <span aria-live="polite">
              {index + 1} / {images.length}
            </span>
          </figcaption>
          {images.length > 1 && (
            <div className="mt-3 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => go(-1)}
                className="rounded border border-neutral-700 p-2 hover:border-primary-500"
                aria-label="Previous image"
              >
                <ChevronLeft className="size-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                className="rounded border border-neutral-700 p-2 hover:border-primary-500"
                aria-label="Next image"
              >
                <ChevronRight className="size-5" aria-hidden="true" />
              </button>
            </div>
          )}
        </figure>
      )}
    </Dialog>
  );
}
