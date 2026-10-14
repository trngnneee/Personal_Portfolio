import { forwardRef, type AnchorHTMLAttributes } from "react";
import { Link } from "react-router";

const EXTERNAL = /^([a-z][a-z0-9+.-]*:|\/\/)/i;

/** Astryx `href` → react-router client navigation; external URLs stay plain anchors. */
export const RouterLink = forwardRef<
  HTMLAnchorElement,
  AnchorHTMLAttributes<HTMLAnchorElement> & { href?: string }
>(function RouterLink({ href = "", ...rest }, ref) {
  if (EXTERNAL.test(href)) return <a ref={ref} href={href} {...rest} />;
  return <Link ref={ref} to={href} {...rest} />;
});
