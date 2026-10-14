const UPLOAD = "/image/upload/";

/** Square-cropped thumbnail for Cloudinary images; other URLs pass through. */
export function thumb(url: string, size = 240): string {
  if (!url.includes("res.cloudinary.com/") || !url.includes(UPLOAD)) return url;
  const [head, tail] = url.split(UPLOAD) as [string, string];
  return `${head}${UPLOAD}f_auto,q_auto,c_fill,w_${size},h_${size}/${tail}`;
}
