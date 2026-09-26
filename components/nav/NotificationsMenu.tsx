"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { Bell } from "@/components/icons";
import { markNotificationsSeen } from "@/lib/actions/account";
import type { NotificationItem } from "@/lib/notifications";
import { timeAgo } from "@/lib/format";
import { useDismiss } from "./useDismiss";

export default function NotificationsMenu({ items }: { items: NotificationItem[] }) {
  const [open, setOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(items.some((n) => n.unread));
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && hasUnread) {
      setHasUnread(false);
      void markNotificationsSeen();
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={hasUnread ? "Notifications, new activity" : "Notifications"}
        className="relative inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
      >
        <Bell className="size-[18px]" />
        {hasUnread && <span className="absolute right-2 top-2 size-2 rounded-full bg-primary ring-2 ring-background" />}
      </button>

      {open && (
        <div className="fixed inset-x-4 top-16 z-50 rounded-sm border border-foreground/30 bg-popover [box-shadow:3px_4px_0_hsl(var(--border))] sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80">
          <p className="border-b border-border px-4 py-3 text-sm font-medium text-foreground">Notifications</p>
          {items.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">
              Nothing new. Activity from collaborators on your boards shows up here.
            </p>
          ) : (
            <ul className="max-h-96 overflow-y-auto py-1">
              {items.map((n) => (
                <li key={n.id}>
                  <Link href={n.href} onClick={close} className="flex gap-3 px-4 py-3 hover:bg-secondary">
                    <span
                      aria-hidden
                      className={`mt-1.5 size-2 shrink-0 rounded-full ${n.unread ? "bg-primary" : "border border-muted-foreground/50"}`}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm text-foreground">{n.text}</span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {n.boardTitle} · {timeAgo(n.createdAt)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
