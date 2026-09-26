import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "@/components/icons";
import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { escapeRegex } from "@/lib/format";
import Board from "@/models/Boards";
import Claim from "@/models/Claim";
import Source from "@/models/Sources";
import Note from "@/models/Note";
import User from "@/models/User";
import SiteShell from "@/components/SiteShell";
import Avatar from "@/components/Avatar";

export const metadata: Metadata = {
  title: "Search",
  description: "Search boards, claims, sources, notes, tags and researchers across Warrant.",
};

type Hit = { id: string; title: string; href: string; meta?: string };

async function runSearch(q: string, userId?: string) {
  await connectToDatabase();
  const rx = { $regex: escapeRegex(q), $options: "i" };

  // Only search inside boards this person is allowed to see.
  const visibility = userId
    ? { $or: [{ isPublic: true }, { owner: userId }, { "members.user": userId }] }
    : { isPublic: true };
  const visibleBoards = await Board.find(visibility).select("_id title").limit(1000).lean<{ _id: object; title: string }[]>();
  const boardTitle = new Map(visibleBoards.map((b) => [String(b._id), b.title]));
  const boardIds = visibleBoards.map((b) => b._id);

  const [boards, claims, sources, notes, people] = await Promise.all([
    Board.find({ ...visibility, $and: [{ $or: [{ title: rx }, { description: rx }, { topic: rx }] }] })
      .select("title description")
      .limit(8)
      .lean<{ _id: object; title: string; description?: string }[]>(),
    Claim.find({ boardId: { $in: boardIds }, $or: [{ title: rx }, { description: rx }, { tags: rx }] })
      .select("title boardId tags")
      .limit(10)
      .lean<{ _id: object; title: string; boardId: object; tags?: string[] }[]>(),
    Source.find({ boardId: { $in: boardIds }, $or: [{ title: rx }, { url: rx }, { summary: rx }] })
      .select("title boardId sourceType")
      .limit(10)
      .lean<{ _id: object; title: string; boardId: object; sourceType?: string }[]>(),
    Note.find({ boardId: { $in: boardIds }, content: rx })
      .select("content boardId")
      .limit(6)
      .lean<{ _id: object; content: string; boardId: object }[]>(),
    User.find({ username: { $exists: true }, $or: [{ name: rx }, { username: rx }] })
      .select("name username image bio")
      .limit(6)
      .lean<{ _id: object; name: string; username: string; image?: string; bio?: string }[]>(),
  ]);

  const inBoard = (id: object) => `in ${boardTitle.get(String(id)) ?? "a board"}`;

  return {
    boards: boards.map<Hit>((b) => ({ id: String(b._id), title: b.title, href: `/boards/${b._id}`, meta: b.description })),
    claims: claims.map<Hit>((c) => ({
      id: String(c._id),
      title: c.title,
      href: `/boards/${c.boardId}?card=claim:${c._id}`,
      meta: [c.tags?.length ? c.tags.map((t) => `#${t}`).join(" ") : "", inBoard(c.boardId)].filter(Boolean).join(" · "),
    })),
    sources: sources.map<Hit>((s) => ({
      id: String(s._id),
      title: s.title,
      href: `/boards/${s.boardId}?card=source:${s._id}`,
      meta: `${s.sourceType ?? "Source"} · ${inBoard(s.boardId)}`,
    })),
    notes: notes.map<Hit>((n) => ({
      id: String(n._id),
      title: n.content.length > 120 ? `${n.content.slice(0, 120)}…` : n.content,
      href: `/boards/${n.boardId}?card=note:${n._id}`,
      meta: inBoard(n.boardId),
    })),
    people,
  };
}

function Group({ label, hits }: { label: string; hits: Hit[] }) {
  if (hits.length === 0) return null;
  return (
    <section>
      <h2 className="eyebrow">{label}</h2>
      <ul className="mt-3 divide-y divide-border rounded-lg border border-border bg-card">
        {hits.map((h) => (
          <li key={h.id}>
            <Link href={h.href} className="block px-4 py-3 hover:bg-muted">
              <span className="block text-foreground">{h.title}</span>
              {h.meta && <span className="mt-0.5 block truncate text-sm text-muted-foreground">{h.meta}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q: raw } = await searchParams;
  const q = raw?.trim().slice(0, 100) || "";
  const user = await getCurrentUser();
  const results = q ? await runSearch(q, user?.id) : null;
  const total = results
    ? results.boards.length + results.claims.length + results.sources.length + results.notes.length + results.people.length
    : 0;

  return (
    <SiteShell>
      <div className="page-container max-w-3xl py-10 sm:py-14">
        <h1 className="font-heading text-4xl text-foreground sm:text-5xl">Search Warrant</h1>
        <form action="/search" role="search" className="relative mt-6">
          <label htmlFor="search-q" className="sr-only">
            Search
          </label>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            id="search-q"
            type="search"
            name="q"
            defaultValue={q}
            autoFocus
            placeholder="Boards, claims, sources, tags or people"
            className="field-input h-12 pl-10"
          />
        </form>

        {!results ? (
          <p className="mt-6 text-sm text-muted-foreground">
            Search covers public boards{user ? ", your boards and boards shared with you" : ""}.
            {!user && " Log in to include your private boards."}
          </p>
        ) : total === 0 ? (
          <p className="mt-10 text-foreground">No results for “{q}”. Try a shorter phrase or a different spelling.</p>
        ) : (
          <div className="mt-10 space-y-10">
            <Group label="Boards" hits={results.boards} />
            <Group label="Claims" hits={results.claims} />
            <Group label="Sources" hits={results.sources} />
            <Group label="Notes" hits={results.notes} />
            {results.people.length > 0 && (
              <section>
                <h2 className="eyebrow">People</h2>
                <ul className="mt-3 divide-y divide-border rounded-lg border border-border bg-card">
                  {results.people.map((p) => (
                    <li key={String(p._id)}>
                      <Link href={`/profile/${p.username}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted">
                        <Avatar name={p.name} image={p.image} size="sm" />
                        <span className="min-w-0">
                          <span className="block text-foreground">{p.name}</span>
                          <span className="block truncate text-sm text-muted-foreground">
                            @{p.username}
                            {p.bio ? ` · ${p.bio}` : ""}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>
    </SiteShell>
  );
}
