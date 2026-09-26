import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getBoardAccess } from "@/lib/permissions";
import User from "@/models/User";
import SiteShell from "@/components/SiteShell";
import BoardSubnav from "@/components/BoardSubnav";
import MembersManager, { type MemberView } from "./MembersManager";

export const metadata: Metadata = {
  title: "Board members",
  description: "Invite collaborators and choose what each person can do on this board.",
};

type UserLite = { _id: object; name: string; username?: string; email: string; image?: string };

export default async function MembersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?callbackUrl=/boards/${id}/members`);

  const access = await getBoardAccess(id, user.id);
  if (!access || !access.canView) notFound();
  if (!access.role) redirect(`/boards/${id}`); // public visitors don't see the member list
  const { board } = access;

  const memberRefs = board.members as { user: object; role: MemberView["role"] }[];
  const users = await User.find({ _id: { $in: [board.owner, ...memberRefs.map((m) => m.user)] } })
    .select("name username email image")
    .lean<UserLite[]>();
  const byId = new Map(users.map((u) => [String(u._id), u]));

  const toView = (u: UserLite | undefined, role: MemberView["role"]): MemberView | null =>
    u
      ? {
          id: String(u._id),
          name: u.name,
          username: u.username,
          // Emails are only shown to the owner.
          email: access.isOwner ? u.email : undefined,
          image: u.image,
          role,
        }
      : null;

  const members = [
    toView(byId.get(String(board.owner)), "owner"),
    ...memberRefs.map((m) => toView(byId.get(String(m.user)), m.role)),
  ].filter((m): m is MemberView => m !== null);

  return (
    <SiteShell>
      <BoardSubnav boardId={id} boardTitle={board.title} current="members" isOwner={access.isOwner} />
      <div className="page-container max-w-4xl py-10">
        <h1 className="font-heading text-2xl text-foreground">Board members</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {access.isOwner
            ? "Invite people by email or username and choose what they can do."
            : `You're a${access.role === "editor" ? "n" : ""} ${access.role} on this board. Only the owner can change members.`}
        </p>
        <MembersManager boardId={id} members={members} canManage={access.isOwner} currentUserId={user.id} />
      </div>
    </SiteShell>
  );
}
