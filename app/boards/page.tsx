import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Plus, Search } from "@/components/icons";
import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { getBoardStats } from "@/lib/data";
import { escapeRegex } from "@/lib/format";
import Board from "@/models/Boards";
import SiteShell from "@/components/SiteShell";
import FlashToast from "@/components/FlashToast";
import { BoardRow, toBoardSummary } from "@/components/BoardCard";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "My boards",
  description: "Every research board you own or collaborate on.",
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "owned", label: "Owned" },
  { key: "shared", label: "Shared with me" },
  { key: "private", label: "Private" },
  { key: "public", label: "Public" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

export default async function BoardsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string; deleted?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/boards");

  const { q: rawQ, filter: rawFilter, deleted } = await searchParams;
  const q = rawQ?.trim() || undefined;
  const filter: FilterKey = FILTERS.some((f) => f.key === rawFilter) ? (rawFilter as FilterKey) : "all";

  const scope =
    filter === "owned"
      ? { owner: user.id }
      : filter === "shared"
        ? { "members.user": user.id }
        : { $or: [{ owner: user.id }, { "members.user": user.id }] };
  const query: Record<string, unknown> = { ...scope };
  if (filter === "private") query.isPublic = false;
  if (filter === "public") query.isPublic = true;
  if (q) {
    const rx = { $regex: escapeRegex(q), $options: "i" };
    query.$and = [{ $or: [{ title: rx }, { description: rx }] }];
  }

  await connectToDatabase();
  const docs = await Board.find(query).sort({ updatedAt: -1 }).lean();
  const stats = await getBoardStats(docs.map((b) => b._id as string));
  const boards = docs.map((b) => {
    const summary = toBoardSummary(b, stats.get(String(b._id)));
    const membership = (b.members as { user: object; role: string }[] | undefined)?.find((m) => String(m.user) === user.id);
    summary.role = String(b.owner) === user.id ? "owner" : membership?.role;
    return summary;
  });

  const hrefFor = (key: FilterKey) => {
    const qs = new URLSearchParams();
    if (q) qs.set("q", q);
    if (key !== "all") qs.set("filter", key);
    const s = qs.toString();
    return s ? `/boards?${s}` : "/boards";
  };

  return (
    <SiteShell>
      {deleted && (
        <Suspense>
          <FlashToast message="Board deleted." param="deleted" />
        </Suspense>
      )}
      <div className="page-container max-w-4xl py-10 sm:py-14">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-heading text-4xl text-foreground sm:text-5xl">My boards</h1>
          <Link href="/boards/new" className={buttonVariants()}>
            <Plus aria-hidden />
            <span className="hidden sm:inline">New board</span>
            <span className="sm:hidden">New</span>
          </Link>
        </div>

        <form action="/boards" role="search" className="relative mt-8">
          <label htmlFor="boards-q" className="sr-only">
            Search your boards
          </label>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input id="boards-q" type="search" name="q" defaultValue={q} placeholder="Search boards" className="field-input pl-10" />
          {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
        </form>

        {/* Filters scroll sideways inside their own strip on small screens instead of widening the page. */}
        <nav aria-label="Filter boards" className="-mx-4 mt-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="flex w-max gap-2">
            {FILTERS.map((f) => (
              <Link
                key={f.key}
                href={hrefFor(f.key)}
                aria-current={filter === f.key ? "true" : undefined}
                className={`inline-flex h-9 items-center rounded-sm border px-3.5 text-sm whitespace-nowrap transition-colors ${
                  filter === f.key
                    ? "border-foreground bg-card text-foreground [box-shadow:2px_2px_0_hsl(var(--foreground))]"
                    : "border-border bg-secondary/70 text-foreground hover:border-input hover:bg-card"
                }`}
              >
                {f.label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="mt-8 space-y-3">
          {boards.length === 0 ? (
            <div className="rounded-lg border border-dashed border-input px-6 py-12 text-center">
              <p className="text-foreground">
                {q || filter !== "all" ? "No boards match these filters." : "You don't have any boards yet."}
              </p>
              {q || filter !== "all" ? (
                <Link href="/boards" className="mt-3 inline-block text-sm font-medium text-primary underline underline-offset-4">
                  Clear filters
                </Link>
              ) : (
                <Link href="/boards/new" className={buttonVariants({ size: "sm", className: "mt-4" })}>
                  Create your first board
                </Link>
              )}
            </div>
          ) : (
            boards.map((b) => <BoardRow key={b.id} board={b} />)
          )}
        </div>
      </div>
    </SiteShell>
  );
}
