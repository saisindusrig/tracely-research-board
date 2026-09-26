import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "@/components/icons";
import { connectToDatabase } from "@/lib/mongodb";
import { getBoardStats } from "@/lib/data";
import { escapeRegex } from "@/lib/format";
import { TOPICS } from "@/lib/constants";
import Board from "@/models/Boards";
import SiteShell from "@/components/SiteShell";
import { BoardCard, toBoardSummary } from "@/components/BoardCard";
import { HandNote } from "@/components/paper";

export const metadata: Metadata = {
  title: "Explore research",
  description: "Browse public research boards by topic and see how others connect claims to evidence.",
};

type Params = { q?: string; topic?: string; sort?: string };

function hrefWith(current: Params, patch: Params) {
  const next = { ...current, ...patch };
  const qs = new URLSearchParams();
  if (next.q) qs.set("q", next.q);
  if (next.topic) qs.set("topic", next.topic);
  if (next.sort && next.sort !== "recent") qs.set("sort", next.sort);
  const s = qs.toString();
  return s ? `/explore?${s}` : "/explore";
}

export default async function ExplorePage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const q = params.q?.trim() || undefined;
  const topic = TOPICS.find((t) => t === params.topic);
  const sort = params.sort === "discussed" ? "discussed" : "recent";

  await connectToDatabase();

  const query: Record<string, unknown> = { isPublic: true };
  if (topic) query.topic = topic;
  if (q) {
    const rx = { $regex: escapeRegex(q), $options: "i" };
    query.$or = [{ title: rx }, { description: rx }];
  }

  const docs = await Board.find(query)
    .populate("owner", "name username")
    .sort({ updatedAt: -1 })
    .limit(60)
    .lean();
  const stats = await getBoardStats(docs.map((b) => b._id as string));
  const boards = docs.map((b) => toBoardSummary(b, stats.get(String(b._id))));
  if (sort === "discussed") boards.sort((a, b) => b.stats.comments - a.stats.comments);

  const current: Params = { q, topic, sort };
  const chip = (active: boolean) =>
    `inline-flex h-9 items-center rounded-sm border px-3.5 text-sm transition-colors ${
      active
        ? "border-foreground bg-card text-foreground [box-shadow:2px_2px_0_hsl(var(--foreground))]"
        : "border-border bg-secondary/70 text-foreground hover:border-input hover:bg-card"
    }`;

  return (
    <SiteShell>
      <div className="page-container py-10 sm:py-14">
        <h1 className="font-heading text-4xl text-foreground sm:text-5xl">Explore research</h1>
        <p className="mt-2 text-muted-foreground">Public boards: see how other people work through a question.</p>
        <HandNote className="mt-1" tone="ink">borrow a good idea or two</HandNote>

        <form action="/explore" role="search" className="relative mt-8">
          <label htmlFor="explore-q" className="sr-only">
            Search public boards
          </label>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            id="explore-q"
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search research"
            className="field-input h-12 pl-10"
          />
          {topic && <input type="hidden" name="topic" value={topic} />}
          {sort !== "recent" && <input type="hidden" name="sort" value={sort} />}
        </form>

        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="eyebrow mb-2">Topics</p>
            <div className="flex flex-wrap gap-2">
              <Link href={hrefWith(current, { topic: undefined })} className={chip(!topic)} aria-current={!topic ? "true" : undefined}>
                All
              </Link>
              {TOPICS.map((t) => (
                <Link key={t} href={hrefWith(current, { topic: t })} className={chip(topic === t)} aria-current={topic === t ? "true" : undefined}>
                  {t}
                </Link>
              ))}
            </div>
          </div>
          <div className="shrink-0">
            <p className="eyebrow mb-2">Sort</p>
            <div className="inline-flex rounded-sm border border-border bg-secondary/70 p-0.5">
              {[
                { key: "recent", label: "Recently updated" },
                { key: "discussed", label: "Most discussed" },
              ].map((s) => (
                <Link
                  key={s.key}
                  href={hrefWith(current, { sort: s.key })}
                  aria-current={sort === s.key ? "true" : undefined}
                  className={`rounded px-3 py-1.5 text-sm ${
                    sort === s.key ? "bg-card text-foreground [box-shadow:1px_1px_0_hsl(var(--foreground))]" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="my-8 h-px bg-border" />

        {boards.length === 0 ? (
          <div className="rounded-lg border border-dashed border-input px-6 py-12 text-center">
            <p className="text-foreground">
              No public boards{q ? ` match “${q}”` : ""}
              {topic ? ` in ${topic}` : ""}.
            </p>
            {(q || topic) && (
              <Link href="/explore" className="mt-3 inline-block text-sm font-medium text-primary underline underline-offset-4">
                Clear filters
              </Link>
            )}
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              {boards.length} {boards.length === 1 ? "board" : "boards"}
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {boards.map((b) => (
                <BoardCard key={b.id} board={b} />
              ))}
            </div>
          </>
        )}
      </div>
    </SiteShell>
  );
}
