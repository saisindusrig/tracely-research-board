import Link from "next/link";
import BoardCover from "@/components/BoardCover";
import { IndexCard } from "@/components/paper";
import { plural, timeAgo } from "@/lib/format";
import type { BoardStats } from "@/lib/data";

export type BoardSummary = {
  id: string;
  title: string;
  description?: string;
  topic?: string;
  isPublic: boolean;
  updatedAt: string;
  owner?: { name: string; username?: string };
  stats: BoardStats;
  memberCount?: number;
  role?: string;
};

/** Serializes a board document plus its stats into plain props. */
export function toBoardSummary(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  board: any,
  stats?: BoardStats
): BoardSummary {
  return {
    id: board._id.toString(),
    title: board.title,
    description: board.description || undefined,
    topic: board.topic || undefined,
    isPublic: Boolean(board.isPublic),
    updatedAt: new Date(board.updatedAt ?? board.createdAt).toISOString(),
    owner: board.owner?.name ? { name: board.owner.name, username: board.owner.username } : undefined,
    stats: stats ?? { claims: 0, sources: 0, comments: 0 },
    memberCount: Array.isArray(board.members) ? board.members.length + 1 : undefined,
  };
}

/** An index card with a pencil-sketch cover, used on Home, Explore and profiles. */
export function BoardCard({ board, showOwner = true }: { board: BoardSummary; showOwner?: boolean }) {
  return (
    <IndexCard as="article" seed={board.id} lift className="group flex h-full flex-col">
      <div className="border-b border-border p-2 pb-0">
        <BoardCover id={board.id} className="aspect-[7/3] border border-rule" />
      </div>
      <div className="flex flex-1 flex-col px-4 pb-4 pt-3">
        {board.topic && <p className="eyebrow mb-1.5 text-primary">{board.topic}</p>}
        <h3 className="font-heading text-[19px] leading-snug text-foreground">
          <Link href={`/boards/${board.id}`} className="after:absolute after:inset-0">
            <span className="link-pencil group-hover:[background-size:14px_6px]">{board.title}</span>
          </Link>
        </h3>
        {board.description && <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{board.description}</p>}
        <p className="mt-auto pt-4 font-tag text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
          {plural(board.stats.claims, "claim")} · {plural(board.stats.sources, "source")}
        </p>
        {showOwner && board.owner && (
          <p className="mt-1 text-sm text-muted-foreground">
            by{" "}
            {board.owner.username ? (
              <Link href={`/profile/${board.owner.username}`} className="link-pencil relative z-10 font-medium text-foreground">
                {board.owner.name}
              </Link>
            ) : (
              <span className="font-medium text-foreground">{board.owner.name}</span>
            )}
          </p>
        )}
      </div>
    </IndexCard>
  );
}

/** Dense row for the /boards library: a ruled index card laid flat. */
export function BoardRow({ board }: { board: BoardSummary }) {
  return (
    <IndexCard as="article" seed={board.id} tilt={false} lift className="group p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 border-b border-destructive/35 pb-2">
        <h3 className="min-w-0 font-heading text-xl leading-snug text-foreground">
          <Link href={`/boards/${board.id}`} className="after:absolute after:inset-0">
            <span className="link-pencil group-hover:[background-size:14px_6px]">{board.title}</span>
          </Link>
        </h3>
        <span className="shrink-0 font-hand text-[15px] text-muted-foreground">{board.isPublic ? "public" : "private"}</span>
      </div>
      {board.description && <p className="mt-2 line-clamp-1 text-sm text-muted-foreground">{board.description}</p>}
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-tag text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
        <span>{plural(board.stats.claims, "claim")}</span>
        <span>{plural(board.stats.sources, "source")}</span>
        {board.memberCount !== undefined && <span>{plural(board.memberCount, "contributor")}</span>}
        {board.role && board.role !== "owner" && <span>Shared with you · {board.role}</span>}
        <span className="sm:ml-auto">Updated {timeAgo(board.updatedAt)}</span>
      </div>
    </IndexCard>
  );
}
