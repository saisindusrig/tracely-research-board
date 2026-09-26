import Board from "@/models/Boards";
import Activity from "@/models/Activity";
import { describeActivity } from "@/lib/activity";

export type NotificationItem = {
  id: string;
  text: string;
  boardTitle: string;
  href: string;
  createdAt: string;
  unread: boolean;
};

/** Recent changes other people made on boards the user owns or belongs to. */
export async function getNotifications(userId: string, seenAt?: Date | null): Promise<NotificationItem[]> {
  const boards = await Board.find({ $or: [{ owner: userId }, { "members.user": userId }] })
    .select("_id")
    .lean<{ _id: unknown }[]>();
  if (boards.length === 0) return [];

  const rows = await Activity.find({
    boardId: { $in: boards.map((b) => b._id) },
    actor: { $ne: userId },
    verb: { $in: ["added", "commented", "invited", "changed_role", "created_board"] },
  })
    .sort({ createdAt: -1 })
    .limit(8)
    .populate("actor", "name")
    .populate("boardId", "title")
    .lean<
      {
        _id: { toString(): string };
        actor?: { name?: string };
        boardId?: { _id: { toString(): string }; title?: string };
        targetUser?: { toString(): string };
        verb: string;
        targetType: string;
        targetTitle?: string;
        createdAt: Date;
      }[]
    >();

  return rows
    .filter((r) => r.boardId)
    .map((r) => {
      const actor = r.actor?.name ?? "Someone";
      const aboutYou = r.targetUser?.toString() === userId;
      const text =
        aboutYou && r.verb === "invited"
          ? `${actor} invited you to a board`
          : aboutYou && r.verb === "changed_role"
            ? `${actor} changed your role`
            : `${actor} ${describeActivity(r)}`;
      return {
        id: r._id.toString(),
        text,
        boardTitle: r.boardId!.title ?? "Untitled board",
        href: `/boards/${r.boardId!._id.toString()}`,
        createdAt: new Date(r.createdAt).toISOString(),
        unread: !seenAt || new Date(r.createdAt) > new Date(seenAt),
      };
    });
}
