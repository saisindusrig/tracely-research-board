import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getBoardAccess } from "@/lib/permissions";
import SiteShell from "@/components/SiteShell";
import BoardSubnav from "@/components/BoardSubnav";
import BoardForm from "@/components/BoardForm";
import DeleteBoard from "./DeleteBoard";

export const metadata: Metadata = {
  title: "Board settings",
  description: "Rename the board, change its topic and visibility, or delete it.",
};

export default async function BoardSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?callbackUrl=/boards/${id}/settings`);

  const access = await getBoardAccess(id, user.id);
  if (!access || !access.canView) notFound();
  if (!access.isOwner) redirect(`/boards/${id}`);
  const { board } = access;

  return (
    <SiteShell>
      <BoardSubnav boardId={id} boardTitle={board.title} current="settings" isOwner />
      <div className="page-container max-w-4xl py-10">
        <section className="max-w-xl">
          <h1 className="font-heading text-2xl text-foreground">General</h1>
          <div className="mt-6">
            <BoardForm
              mode="edit"
              boardId={id}
              cancelHref={`/boards/${id}`}
              initial={{
                title: board.title,
                description: board.description ?? "",
                topic: board.topic ?? "",
                isPublic: board.isPublic,
              }}
            />
          </div>
        </section>

        <section className="mt-14 max-w-xl rounded-lg border border-destructive/40 p-5 sm:p-6">
          <h2 className="font-heading text-xl text-destructive">Danger zone</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Deleting a board permanently removes every claim, source, piece of evidence, note, comment and its history.
            This can&apos;t be undone.
          </p>
          <div className="mt-5">
            <DeleteBoard boardId={id} boardTitle={board.title} />
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
