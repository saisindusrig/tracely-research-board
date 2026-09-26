import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { getCurrentUser } from "@/lib/auth";
import { getBoardAccess } from "@/lib/permissions";
import Claim from "@/models/Claim";
import Source from "@/models/Sources";
import Evidence from "@/models/Evidence";
import Note from "@/models/Note";
import Comment from "@/models/Comment";
import "@/models/User";
import Logo from "@/components/Logo";
import { buttonVariants } from "@/components/ui/button";
import BoardWorkspace from "@/components/workspace/BoardWorkspace";
import type { BoardData, CardType, Selection } from "@/components/workspace/types";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const user = await getCurrentUser();
  const access = await getBoardAccess(id, user?.id);
  if (!access) return { title: "Board not found" };
  // Don't leak private board names through the tab title or link previews.
  if (!access.canView) return { title: "Private board", robots: { index: false } };
  return {
    title: access.board.title,
    description:
      access.board.description ||
      `A research board on Warrant mapping claims, sources and evidence${access.board.topic ? ` about ${access.board.topic}` : ""}.`,
    robots: access.board.isPublic ? undefined : { index: false },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Doc = any;

const iso = (d: Date | string) => new Date(d).toISOString();
const pos = (p?: { x?: number; y?: number }) =>
  p && typeof p.x === "number" && typeof p.y === "number" ? { x: p.x, y: p.y } : null;

export default async function BoardWorkspacePage({
  params,
  searchParams,
}: Params & { searchParams: Promise<{ card?: string; created?: string }> }) {
  const [{ id }, { card, created }] = await Promise.all([params, searchParams]);
  const user = await getCurrentUser();
  const access = await getBoardAccess(id, user?.id);
  if (!access) notFound();

  if (!access.canView) {
    if (!user) redirect(`/login?callbackUrl=/boards/${id}`);
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
        <Logo />
        <h1 className="mt-10 font-heading text-3xl text-foreground">This board is private.</h1>
        <p className="mt-3 max-w-sm text-muted-foreground">Ask the owner to invite you, then open the link again.</p>
        <Link href="/dashboard" className={buttonVariants({ className: "mt-8" })}>
          Back to your dashboard
        </Link>
      </main>
    );
  }

  const { board } = access;
  const [claims, sources, notes, evidence, comments] = await Promise.all([
    Claim.find({ boardId: id }).sort({ createdAt: 1 }).populate("author", "name").lean<Doc[]>(),
    Source.find({ boardId: id }).sort({ createdAt: 1 }).populate("author", "name").lean<Doc[]>(),
    Note.find({ boardId: id }).sort({ createdAt: 1 }).populate("author", "name").lean<Doc[]>(),
    Evidence.find({ boardId: id }).lean<Doc[]>(),
    Comment.find({ boardId: id }).sort({ createdAt: 1 }).populate("author", "name image").lean<Doc[]>(),
  ]);

  const data: BoardData = {
    claims: claims.map((c) => ({
      id: String(c._id),
      title: c.title,
      description: c.description || undefined,
      tags: c.tags ?? [],
      status: c.status ?? "UNVERIFIED",
      authorName: c.author?.name,
      createdAt: iso(c.createdAt),
      position: pos(c.position),
    })),
    sources: sources.map((s) => ({
      id: String(s._id),
      title: s.title,
      url: s.url || undefined,
      sourceType: s.sourceType ?? "Website",
      summary: s.summary || undefined,
      authorName: s.author?.name,
      createdAt: iso(s.createdAt),
      position: pos(s.position),
    })),
    notes: notes.map((n) => ({
      id: String(n._id),
      content: n.content,
      authorName: n.author?.name,
      createdAt: iso(n.createdAt),
      position: pos(n.position),
    })),
    evidence: evidence.map((e) => ({
      id: String(e._id),
      claimId: String(e.claimId),
      sourceId: String(e.sourceId),
      relationship: e.relationship,
      explanation: e.explanation || undefined,
    })),
    comments: comments.map((c) => ({
      id: String(c._id),
      targetId: String(c.targetId),
      authorName: c.author?.name ?? "Former member",
      authorImage: c.author?.image,
      content: c.content,
      createdAt: iso(c.createdAt),
    })),
  };

  // `?card=claim:<id>` (used by search results) opens that card's details.
  let initialCard: Selection = null;
  const [cardType, cardId] = card?.split(":") ?? [];
  if (["claim", "source", "note", "evidence"].includes(cardType) && isValidObjectId(cardId)) {
    initialCard = { type: cardType as CardType, id: cardId };
  }

  return (
    <BoardWorkspace
      board={{ id, title: board.title, description: board.description || undefined, isPublic: board.isPublic }}
      data={data}
      perms={{
        signedIn: Boolean(user),
        role: access.role,
        canEdit: access.canEdit,
        canComment: access.canComment,
        isOwner: access.isOwner,
      }}
      initialCard={initialCard}
      created={Boolean(created) && access.isOwner}
    />
  );
}
