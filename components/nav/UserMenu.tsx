"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { ChevronDown } from "@/components/icons";
import Avatar from "@/components/Avatar";
import { useDismiss } from "./useDismiss";

export default function UserMenu({
  name,
  email,
  image,
  profileHref,
}: {
  name: string;
  email?: string | null;
  image?: string | null;
  profileHref?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  const item = "block rounded px-3 py-2 text-sm text-foreground hover:bg-secondary";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex items-center gap-1 rounded-full p-0.5 hover:bg-secondary md:rounded-md md:py-1 md:pl-1 md:pr-2"
      >
        <Avatar name={name} image={image} size="sm" />
        <ChevronDown className="hidden size-4 text-muted-foreground md:block" aria-hidden />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-60 rounded-sm border border-foreground/30 bg-popover p-1.5 [box-shadow:3px_4px_0_hsl(var(--border))]"
        >
          <div className="border-b border-border px-3 pb-2.5 pt-1.5">
            <p className="truncate text-sm font-medium text-foreground">{name}</p>
            {email && <p className="truncate text-xs text-muted-foreground">{email}</p>}
          </div>
          <div className="py-1">
            <Link role="menuitem" href="/dashboard" className={item} onClick={close}>
              Your desk
            </Link>
            <Link role="menuitem" href="/boards" className={item} onClick={close}>
              My boards
            </Link>
            {profileHref && (
              <Link role="menuitem" href={profileHref} className={item} onClick={close}>
                Your profile
              </Link>
            )}
            <Link role="menuitem" href="/settings" className={item} onClick={close}>
              Settings
            </Link>
          </div>
          <div className="border-t border-border pt-1">
            <button
              role="menuitem"
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className={`${item} w-full text-left`}
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
