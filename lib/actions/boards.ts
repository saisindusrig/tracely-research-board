"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";
import { requireBoard } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { MEMBER_ROLES, TOPICS, type MemberRole } from "@/lib/constants";
import Board from "@/models/Boards";
import User from "@/models/User";
import Claim from "@/models/Claim";
import Source from "@/models/Sources";
import Evidence from "@/models/Evidence";
import Note from "@/models/Note";
import Comment from "@/models/Comment";
import Activity from "@/models/Activity";

export type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string };

type BoardInput = {
  title: string;
  description?: string;
  topic?: string;
  isPublic: boolean;
};

function cleanBoardInput(input: BoardInput) {
  const title = input.title?.trim() ?? "";
  const topic = TOPICS.includes(input.topic as (typeof TOPICS)[number]) ? input.topic : undefined;
  return {
    title,
    description: input.description?.trim() || undefined,
    topic,
    isPublic: Boolean(input.isPublic),
  };
}

export async function createBoard(input: BoardInput): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in to create a board." };

  const data = cleanBoardInput(input);
  if (!data.title) return { ok: false, error: "Give your board a name." };
  if (data.title.length > 120) return { ok: false, error: "Board names can be up to 120 characters." };

  try {
    await connectToDatabase();
    const board = await Board.create({ ...data, owner: user.id });
    await logActivity({
      boardId: board._id.toString(),
      actor: user.id,
      verb: "created_board",
      targetType: "board",
      targetTitle: board.title,
    });
    revalidatePath("/dashboard");
    revalidatePath("/boards");
    return { ok: true, data: { id: board._id.toString() } };
  } catch (error) {
    console.error("Failed to create board:", error);
    return { ok: false, error: "Couldn't create the board. Please try again." };
  }
}

export async function updateBoard(boardId: string, input: BoardInput): Promise<ActionResult> {
  const guard = await requireBoard(boardId, "owner");
  if ("error" in guard) return { ok: false, error: guard.error as string };

  const data = cleanBoardInput(input);
  if (!data.title) return { ok: false, error: "Board name can't be empty." };

  try {
    await Board.updateOne(
      { _id: boardId },
      { $set: { title: data.title, description: data.description ?? "", topic: data.topic ?? "", isPublic: data.isPublic } }
    );
    await logActivity({ boardId, actor: guard.user.id, verb: "updated_board", targetType: "board", targetTitle: data.title });
    revalidatePath(`/boards/${boardId}`, "layout");
    return { ok: true };
  } catch (error) {
    console.error("Failed to update board:", error);
    return { ok: false, error: "Couldn't save changes. Please try again." };
  }
}

export async function deleteBoard(boardId: string): Promise<ActionResult> {
  const guard = await requireBoard(boardId, "owner");
  if ("error" in guard) return { ok: false, error: guard.error as string };

  try {
    await Promise.all([
      Claim.deleteMany({ boardId }),
      Source.deleteMany({ boardId }),
      Evidence.deleteMany({ boardId }),
      Note.deleteMany({ boardId }),
      Comment.deleteMany({ boardId }),
      Activity.deleteMany({ boardId }),
    ]);
    await Board.deleteOne({ _id: boardId });
  } catch (error) {
    console.error("Failed to delete board:", error);
    return { ok: false, error: "Couldn't delete the board. Please try again." };
  }
  revalidatePath("/dashboard");
  redirect("/boards?deleted=1");
}

export async function inviteMember(
  boardId: string,
  identifier: string,
  role: MemberRole
): Promise<ActionResult<{ name: string }>> {
  const guard = await requireBoard(boardId, "owner");
  if ("error" in guard) return { ok: false, error: guard.error as string };
  if (!MEMBER_ROLES.includes(role)) return { ok: false, error: "Pick a role." };

  const value = identifier.trim().toLowerCase().replace(/^@/, "");
  if (!value) return { ok: false, error: "Enter an email or username." };

  const invitee = await User.findOne(value.includes("@") ? { email: value } : { username: value });
  if (!invitee) {
    return { ok: false, error: "No Warrant account matches that email or username." };
  }

  const board = guard.access.board;
  const inviteeId = invitee._id.toString();
  if (board.owner.toString() === inviteeId) return { ok: false, error: "That's you. You already own this board." };
  if (board.members.some((m: { user: { toString(): string } }) => m.user.toString() === inviteeId)) {
    return { ok: false, error: `${invitee.name} is already a member.` };
  }

  await Board.updateOne({ _id: boardId }, { $push: { members: { user: invitee._id, role } } });
  await logActivity({
    boardId,
    actor: guard.user.id,
    verb: "invited",
    targetType: "member",
    targetTitle: invitee.name,
    targetUser: inviteeId,
  });
  revalidatePath(`/boards/${boardId}/members`);
  return { ok: true, data: { name: invitee.name } };
}

export async function updateMemberRole(boardId: string, userId: string, role: MemberRole): Promise<ActionResult> {
  const guard = await requireBoard(boardId, "owner");
  if ("error" in guard) return { ok: false, error: guard.error as string };
  if (!MEMBER_ROLES.includes(role)) return { ok: false, error: "Pick a role." };

  const res = await Board.updateOne(
    { _id: boardId, "members.user": userId },
    { $set: { "members.$.role": role } }
  );
  if (res.matchedCount === 0) return { ok: false, error: "That person is no longer a member." };

  const member = await User.findById(userId).select("name");
  await logActivity({
    boardId,
    actor: guard.user.id,
    verb: "changed_role",
    targetType: "member",
    targetTitle: `${member?.name ?? "a member"} to ${role}`,
    targetUser: userId,
  });
  revalidatePath(`/boards/${boardId}/members`);
  return { ok: true };
}

export async function removeMember(boardId: string, userId: string): Promise<ActionResult> {
  const guard = await requireBoard(boardId, "owner");
  if ("error" in guard) return { ok: false, error: guard.error as string };

  await Board.updateOne({ _id: boardId }, { $pull: { members: { user: userId } } });
  const member = await User.findById(userId).select("name");
  await logActivity({
    boardId,
    actor: guard.user.id,
    verb: "removed_member",
    targetType: "member",
    targetTitle: member?.name,
  });
  revalidatePath(`/boards/${boardId}/members`);
  return { ok: true };
}
