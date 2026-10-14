import { Menu, Terminal, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Link, useLocation } from "react-router";
import { cn } from "@/lib/cn";
import { useSite } from "@/lib/queries";
import { buildNav, isActive } from "./nav";

export function Navbar() {
  const { data } = useSite();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const items = data ? buildNav(data.sections) : [];
  const handle = data?.profile?.handle ?? "trngnneee";

  // Close the mobile menu on navigation (state adjusted during render, no effect).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  const link = (to: string, label: string, mobile = false) => {
    const active = isActive(pathname, to);
    return (
      <Link
        key={to}
        to={to}
        aria-current={active ? "page" : undefined}
        className={cn(
          "relative rounded px-3 py-2 font-mono text-sm transition-colors",
          active ? "text-primary-400" : "text-neutral-300 hover:text-neutral-50",
          mobile && "block py-3 text-base",
        )}
      >
        {active && !mobile && (
          <motion.span
            layoutId="nav-underline"
            className="absolute inset-x-3 -bottom-px h-0.5 bg-primary-500"
          />
        )}
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-800 bg-bg-page/85 backdrop-blur">
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4"
      >
        <Link to="/" className="flex items-center gap-2 font-mono font-bold text-neutral-50">
          <Terminal className="size-5 text-primary-500" aria-hidden="true" />
          <span>
            {handle}
            <span className="text-primary-500">_</span>
          </span>
        </Link>

        <div className="hidden items-center md:flex">{items.map((i) => link(i.to, i.label))}</div>

        <button
          type="button"
          className="rounded p-2 text-neutral-200 hover:bg-bg-elevated md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? (
            <X className="size-6" aria-hidden="true" />
          ) : (
            <Menu className="size-6" aria-hidden="true" />
          )}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-neutral-800 md:hidden"
          >
            <div className="px-4 py-2">{items.map((i) => link(i.to, i.label, true))}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
