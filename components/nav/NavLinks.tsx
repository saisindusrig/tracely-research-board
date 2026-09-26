"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Search } from "@/components/icons";

export type NavLink = { href: string; label: string };

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Desktop links with an active state, plus the "/" shortcut to search. */
export default function NavLinks({ links }: { links: NavLink[] }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const typing = el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName);
      if (typing) return;
      if (e.key === "/" || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        router.push("/search");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return (
    <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
      {links.map((l) => {
        const active = isActive(pathname, l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`relative inline-flex items-center gap-1.5 rounded-sm px-3 py-2 text-sm transition-colors hover:text-foreground ${
              active ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {l.href === "/search" && <Search className="size-4" aria-hidden />}
            <span className={active ? "link-pencil [background-size:14px_6px]" : "link-pencil"}>{l.label}</span>
            {l.href === "/search" && (
              <kbd className="ml-1 hidden rounded border border-border px-1.5 font-tag text-[10px] text-muted-foreground lg:inline">
                /
              </kbd>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
