"use client";

import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { ArrowUpRight, MessageSquare } from "@/components/icons";
import { HandCircle, Tape } from "@/components/paper";
import { timeAgo } from "@/lib/format";
import { tiltFor } from "@/lib/rough";
import type { ClaimData, NoteData, SourceData } from "./types";

type Extra = { commentCount: number; canConnect: boolean; ordinal: number };

export type ClaimNodeType = Node<ClaimData & Extra, "claim">;
export type SourceNodeType = Node<SourceData & Extra, "source">;
export type NoteNodeType = Node<NoteData & Extra, "note">;

// Connection dots look like a pencil dot on the card edge.
const handleClass = (show: boolean) =>
  `!size-3 !rounded-full !border-2 !border-card !bg-primary ${show ? "" : "!opacity-0 !pointer-events-none"}`;

const pad = (n: number) => String(n).padStart(2, "0");

function Comments({ n }: { n: number }) {
  if (!n) return null;
  return (
    <span className="inline-flex items-center gap-1" aria-label={`${n} comments`}>
      <MessageSquare className="size-3.5" />
      {n}
    </span>
  );
}

function Status({ status }: { status: ClaimData["status"] }) {
  const word = status.toLowerCase();
  if (status === "VERIFIED") return <HandCircle tone="green" className="font-hand text-[14px] text-supports">{word}</HandCircle>;
  if (status === "DISPUTED") return <HandCircle tone="red" className="font-hand text-[14px] text-challenges">{word}</HandCircle>;
  return <span className="font-hand text-[14px] text-muted-foreground">{word}</span>;
}

export function ClaimNode({ id, data }: NodeProps<ClaimNodeType>) {
  return (
    <div
      className="index-card w-[264px] px-4 pb-3.5 pt-2.5 [box-shadow:3px_4px_0_hsl(var(--border))]"
      style={{ transform: `rotate(${tiltFor(id, 0.9)}deg)` }}
    >
      <Handle type="target" position={Position.Top} className={handleClass(data.canConnect)} />
      <div className="flex items-center justify-between gap-2 border-b border-destructive/45 pb-1.5">
        <span className="font-tag text-[10.5px] font-medium uppercase tracking-[0.14em] text-primary">Claim · {pad(data.ordinal)}</span>
        <Status status={data.status} />
      </div>
      <h3 className="mt-2.5 font-heading text-[17px] leading-snug text-foreground">{data.title}</h3>
      {data.tags.length > 0 && (
        <p className="mt-2 flex flex-wrap gap-x-2 font-hand text-[15px] leading-tight text-primary">
          {data.tags.map((t) => (
            <span key={t}>#{t}</span>
          ))}
        </p>
      )}
      <div className="mt-3 flex items-center justify-between gap-2 text-[11.5px] text-muted-foreground">
        <span className="truncate" suppressHydrationWarning>
          {data.authorName ? `${data.authorName} · ` : ""}
          {timeAgo(data.createdAt)}
        </span>
        <Comments n={data.commentCount} />
      </div>
      <Handle type="source" position={Position.Bottom} className={handleClass(data.canConnect)} />
    </div>
  );
}

export function SourceNode({ id, data }: NodeProps<SourceNodeType>) {
  return (
    <div className="relative w-[244px]" style={{ transform: `rotate(${tiltFor(id, 0.8)}deg)` }}>
      <Handle type="target" position={Position.Top} className={handleClass(data.canConnect)} />
      {/* Folded top-right corner */}
      <div
        className="border border-border bg-card px-4 pb-3.5 pt-3 [box-shadow:2px_3px_0_hsl(var(--border))]"
        style={{ clipPath: "polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 0 100%)" }}
      >
        <span className="font-tag text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {data.sourceType} · S{pad(data.ordinal)}
        </span>
        <h3 className="mt-2 text-[14px] font-medium leading-snug text-foreground">{data.title}</h3>
        <div className="mt-3 flex items-center justify-between gap-2 text-[11.5px] text-muted-foreground">
          {data.url ? (
            <a
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="nodrag link-pencil inline-flex items-center gap-0.5 font-medium text-primary"
            >
              Open source
              <ArrowUpRight className="size-3.5" />
            </a>
          ) : (
            <span>No link</span>
          )}
          <Comments n={data.commentCount} />
        </div>
      </div>
      <span
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 size-[18px] border-b border-l border-border bg-secondary"
        style={{ clipPath: "polygon(0 0, 100% 100%, 0 100%)" }}
      />
      <Handle type="source" position={Position.Bottom} className={handleClass(data.canConnect)} />
    </div>
  );
}

export function NoteNode({ id, data }: NodeProps<NoteNodeType>) {
  return (
    <div
      className="relative w-[216px] border border-[hsl(49_55%_70%)] bg-accent px-4 pb-4 pt-5 [box-shadow:2px_3px_0_hsl(49_40%_72%)]"
      style={{ transform: `rotate(${tiltFor(id, 1.6)}deg)` }}
    >
      <Tape seed={id} />
      <div className="flex items-start justify-between gap-2">
        <p className="line-clamp-[8] whitespace-pre-wrap font-hand text-[16px] leading-snug text-accent-foreground">{data.content}</p>
        <span className="shrink-0 pt-1 text-[11.5px] text-muted-foreground">
          <Comments n={data.commentCount} />
        </span>
      </div>
    </div>
  );
}

export const nodeTypes = { claim: ClaimNode, source: SourceNode, note: NoteNode };
