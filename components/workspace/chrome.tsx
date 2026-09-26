"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { useReactFlow, useViewport } from "@xyflow/react";
import { ArrowLeft, Ellipsis, Link2, Maximize, Minus, Plus } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";
import { toast } from "@/components/Toaster";
import { useDismiss } from "@/components/nav/useDismiss";
import { HandCircle } from "@/components/paper";
import { LogoMark } from "@/components/Logo";
import type { BoardInfo, Compose, Permissions } from "./types";

type AddKind = "claim" | "source" | "evidence" | "note";

export const TOOLS: { kind: AddKind; label: string; key: string }[] = [
  { kind: "claim", label: "Claim", key: "c" },
  { kind: "source", label: "Source", key: "s" },
  { kind: "evidence", label: "Evidence", key: "e" },
  { kind: "note", label: "Note", key: "n" },
];

async function copyBoardLink(isPublic: boolean) {
  const url = `${window.location.origin}${window.location.pathname}`;
  try {
    await navigator.clipboard.writeText(url);
    toast(isPublic ? "Link copied. Anyone with it can view this board." : "Link copied. Only members can open this private board.");
  } catch {
    toast("Couldn't copy automatically. Copy the link from the address bar.", "error");
  }
}

// ------------------------------------------------------------------ top bar

export function TopBar({ board, perms }: { board: BoardInfo; perms: Permissions }) {
  const backHref = perms.role ? "/boards" : "/explore";
  const links = [
    ...(perms.role ? [{ href: `/boards/${board.id}/members`, label: "Members" }] : []),
    { href: `/boards/${board.id}/history`, label: "History" },
    ...(perms.isOwner ? [{ href: `/boards/${board.id}/settings`, label: "Settings" }] : []),
  ];

  return (
    <header className="flex h-14 shrink-0 items-center gap-1 border-b border-foreground/15 bg-background px-2 sm:gap-2 sm:px-3">
      <Link href="/" aria-label="Warrant home" className="hidden shrink-0 rounded-sm p-1 sm:block">
        <LogoMark />
      </Link>
      <Link
        href={backHref}
        className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
        aria-label={perms.role ? "Back to your boards" : "Back to Explore"}
      >
        <ArrowLeft className="size-4" aria-hidden />
        <span className="hidden sm:inline">{perms.role ? "Boards" : "Explore"}</span>
      </Link>
      <span className="hidden h-5 w-px bg-border sm:block" aria-hidden />

      <div className="flex min-w-0 flex-1 items-center gap-2 px-1">
        <h1 className="truncate font-heading text-lg text-foreground sm:text-xl">{board.title}</h1>
        <HandCircle tone="pencil" className="hidden shrink-0 font-hand text-[14px] text-muted-foreground sm:inline-block">
          {board.isPublic ? "public" : "private"}
        </HandCircle>
      </div>

      <nav aria-label="Board" className="hidden items-center gap-1 md:flex">
        <button
          type="button"
          onClick={() => copyBoardLink(board.isPublic)}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <Link2 aria-hidden />
          Share
        </button>
        {links.map((l) => (
          <Link key={l.href} href={l.href} className={buttonVariants({ variant: "ghost", size: "sm" })}>
            {l.label}
          </Link>
        ))}
      </nav>

      {!perms.signedIn && (
        <Link href={`/login?callbackUrl=/boards/${board.id}`} className={buttonVariants({ size: "sm" })}>
          Log in
        </Link>
      )}

      <BoardMenu board={board} links={links} />
    </header>
  );
}

function BoardMenu({ board, links }: { board: BoardInfo; links: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);
  const item = "block w-full rounded px-3 py-2.5 text-left text-sm text-foreground hover:bg-secondary";

  return (
    <div ref={ref} className="relative md:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Board options"
        className="inline-flex size-10 items-center justify-center rounded-md text-foreground hover:bg-secondary"
      >
        <Ellipsis className="size-5" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-1 w-52 rounded-sm border border-foreground/30 bg-popover p-1.5 [box-shadow:3px_4px_0_hsl(var(--border))]">
          <p className="px-3 pb-2 pt-1 text-xs text-muted-foreground">{board.isPublic ? "Public board" : "Private board"}</p>
          <button
            role="menuitem"
            type="button"
            className={item}
            onClick={() => {
              close();
              copyBoardLink(board.isPublic);
            }}
          >
            Copy share link
          </button>
          {links.map((l) => (
            <Link key={l.href} role="menuitem" href={l.href} className={item} onClick={close}>
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ tool rail (desktop)

/** A tiny drawing of the thing each tool creates, used instead of generic icons. */
export function ToolSwatch({ kind }: { kind: AddKind }) {
  return (
    <svg viewBox="0 0 24 18" aria-hidden className="h-[18px] w-6 shrink-0 overflow-visible">
      {kind === "claim" && (
        <g transform="rotate(-4 12 9)">
          <rect x="2" y="2.5" width="20" height="13" rx="1" className="fill-card stroke-foreground" strokeWidth="1.3" />
          <path d="M4.5 6.3h15" className="stroke-destructive" strokeWidth="1" />
          <path d="M5 10h10M5 12.6h7" className="stroke-foreground/50" strokeWidth="1" strokeLinecap="round" />
        </g>
      )}
      {kind === "source" && (
        <g transform="rotate(3 12 9)">
          <path d="M2.5 2.5h15l4 4v9h-19z" className="fill-card stroke-foreground" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M17.5 2.5v4h4" className="fill-secondary stroke-foreground" strokeWidth="1.1" strokeLinejoin="round" />
          <path d="M5 9h10M5 11.8h8" className="stroke-foreground/50" strokeWidth="1" strokeLinecap="round" />
        </g>
      )}
      {kind === "evidence" && (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6">
          <path d="M3 3.5c3 6 9 3 13.5 10.5" className="stroke-supports" />
          <path d="M12.6 13.2l4 1.2.4-4" className="stroke-supports" />
          <circle cx="3" cy="3.5" r="1.6" className="fill-primary stroke-none" />
        </g>
      )}
      {kind === "note" && (
        <g transform="rotate(5 12 9)">
          <rect x="4" y="2" width="15" height="14" className="fill-accent stroke-[hsl(49_40%_60%)]" strokeWidth="1.1" />
          <rect x="8.5" y="0.6" width="6" height="2.6" className="fill-tape" />
        </g>
      )}
    </svg>
  );
}

export function ToolRail({ active, onAdd }: { active?: Compose; onAdd: (k: AddKind) => void }) {
  return (
    <div className="hidden w-44 shrink-0 flex-col border-r-2 border-destructive/30 bg-secondary/70 p-3 md:flex">
      <p className="px-2 pb-2 pt-1 font-hand text-[17px] text-muted-foreground">add to the page</p>
      <div className="flex flex-col gap-1">
        {TOOLS.map((t) => {
          const isActive = active?.kind === t.kind && !active.editId;
          return (
            <button
              key={t.kind}
              type="button"
              onClick={() => onAdd(t.kind)}
              aria-pressed={isActive}
              className={`flex h-11 items-center gap-2.5 rounded-sm border px-2 text-sm transition-colors ${
                isActive
                  ? "border-foreground bg-card text-foreground [box-shadow:2px_2px_0_hsl(var(--foreground))]"
                  : "border-transparent text-foreground hover:border-border hover:bg-card"
              }`}
            >
              <ToolSwatch kind={t.kind} />
              <span className="flex-1 text-left">{t.label}</span>
              <kbd className="font-tag text-[10px] uppercase text-muted-foreground">{t.key}</kbd>
            </button>
          );
        })}
      </div>
      <p className="mt-auto px-2 font-hand text-[15px] leading-snug text-muted-foreground">
        tip: drag from the dot on a claim to a source to connect them
      </p>
    </div>
  );
}

// ------------------------------------------------------------------ mobile action bar

export function MobileActionBar({ onAdd }: { onAdd: (k: AddKind) => void }) {
  return (
    <nav
      aria-label="Add to board"
      className="grid shrink-0 grid-cols-4 border-t border-foreground/15 bg-secondary pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {TOOLS.map((t) => (
        <button
          key={t.kind}
          type="button"
          onClick={() => onAdd(t.kind)}
          className="flex h-16 flex-col items-center justify-center gap-1.5 text-foreground active:bg-card"
        >
          <ToolSwatch kind={t.kind} />
          <span className="text-xs">{t.label}</span>
        </button>
      ))}
    </nav>
  );
}

// ------------------------------------------------------------------ zoom controls

export function ZoomControls({ compact = false }: { compact?: boolean }) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const { zoom } = useViewport();
  const btn = "inline-flex size-9 items-center justify-center rounded-sm text-foreground hover:bg-card";

  return (
    <div className={`flex items-center ${compact ? "rounded-sm border border-foreground/60 bg-card [box-shadow:2px_2px_0_hsl(var(--border))]" : "gap-1"}`}>
      <button type="button" className={btn} onClick={() => zoomOut({ duration: 150 })} aria-label="Zoom out">
        <Minus className="size-4" />
      </button>
      {!compact && <span className="w-12 text-center font-tag text-xs normal-case tabular-nums tracking-normal text-muted-foreground">{Math.round(zoom * 100)}%</span>}
      <button type="button" className={btn} onClick={() => zoomIn({ duration: 150 })} aria-label="Zoom in">
        <Plus className="size-4" />
      </button>
      <button
        type="button"
        className={compact ? btn : `${btn} ml-2 w-auto gap-1.5 px-2.5 text-sm`}
        onClick={() => fitView({ padding: 0.2, maxZoom: 1, duration: 250 })}
        aria-label="Fit board to screen"
      >
        <Maximize className="size-4" />
        {!compact && "Fit screen"}
      </button>
    </div>
  );
}
