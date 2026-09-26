import { cache } from "react";
import { isValidObjectId } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";
import Board from "@/models/Boards";
import { permissionsFor, resolveRole } from "@/lib/validation";

/**
 * Resolves what a user may do on a board. Public boards are viewable by
 * anyone; editing and commenting need a role on the board.
 * Memoized per request so a page and its generateMetadata share one query.
 */
export const getBoardAccess = cache(async (boardId: string, userId?: string | null) => {
  if (!isValidObjectId(boardId)) return null;
  await connectToDatabase();
  const board = await Board.findById(boardId);
  if (!board) return null;

  const role = resolveRole(board, userId);
  return { board, role, ...permissionsFor(role, board.isPublic === true) };
});

export type BoardAccess = NonNullable<Awaited<ReturnType<typeof getBoardAccess>>>;

type Need = "view" | "comment" | "edit" | "owner";

/**
 * Guard for server actions. Returns the user and access, or an error
 * message that is safe to show in the UI.
 */
export async function requireBoard(boardId: string, need: Need) {
  const user = await getCurrentUser();
  if (!user) return { error: "Please log in to continue." } as const;

  const access = await getBoardAccess(boardId, user.id);
  if (!access) return { error: "This board no longer exists." } as const;

  const allowed =
    need === "view"
      ? access.canView
      : need === "comment"
        ? access.canComment
        : need === "edit"
          ? access.canEdit
          : access.isOwner;
  if (!allowed) return { error: "You don't have permission to do that on this board." } as const;

  return { user, access } as const;
}
