"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { Menu, X } from "@/components/icons";
import { isActive, type NavLink } from "./NavLinks";

export default function MobileMenu({
  links,
  signedIn,
  profileHref,
}: {
  links: NavLink[];
  signedIn: boolean;
  profileHref?: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);

  // Close when the route changes (adjusting state during render, per React docs).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  // Lock page scroll and support Escape while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    panelRef.current?.querySelector<HTMLElement>("a,button")?.focus();
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const allLinks: NavLink[] = [
    ...links,
    ...(signedIn
      ? [
          { href: "/dashboard", label: "Your desk" },
          ...(profileHref ? [{ href: profileHref, label: "Your profile" }] : []),
          { href: "/settings", label: "Settings" },
        ]
      : []),
  ];

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        className="-ml-2 inline-flex size-10 items-center justify-center rounded-sm text-foreground hover:bg-secondary"
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 top-16 z-40 bg-foreground/20" onClick={close} aria-hidden />
          <div
            id="mobile-menu"
            ref={panelRef}
            className="paper-ruled fixed inset-x-0 top-16 z-50 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-foreground/20 pb-6 pl-12 pr-4 pt-2"
          >
            <nav aria-label="Mobile" className="flex flex-col">
              {allLinks.map((l) => {
                const active = isActive(pathname, l.href);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={close}
                    aria-current={active ? "page" : undefined}
                    className={`border-b border-rule py-3.5 font-heading text-xl ${
                      active ? "text-foreground" : "text-foreground/80"
                    }`}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-5 flex flex-col gap-2">
              {signedIn ? (
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="h-11 rounded-md border border-foreground bg-card text-sm font-medium text-foreground hover:bg-secondary"
                >
                  Log out
                </button>
              ) : (
                <>
                  <Link
                    href="/register"
                    onClick={close}
                    className="flex h-11 items-center justify-center rounded-md border border-foreground bg-primary text-sm font-medium text-primary-foreground [box-shadow:2px_2px_0_hsl(var(--foreground))] hover:bg-primary-hover"
                  >
                    Sign up
                  </Link>
                  <Link
                    href="/login"
                    onClick={close}
                    className="flex h-11 items-center justify-center rounded-md border border-foreground bg-card text-sm font-medium text-foreground hover:bg-secondary"
                  >
                    Log in
                  </Link>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
