import Activity from "@/models/Activity";
import Board from "@/models/Boards";

type LogInput = {
  boardId: string;
  actor: string;
  verb:
    | "created_board"
    | "updated_board"
    | "added"
    | "updated"
    | "deleted"
    | "commented"
    | "invited"
    | "changed_role"
    | "removed_member";
  targetType: "board" | "claim" | "source" | "evidence" | "note" | "member";
  targetTitle?: string;
  targetUser?: string;
};

/**
 * Records an activity row and marks the board as recently updated.
 * Never throws: history must not block a save.
 */
export async function logActivity(input: LogInput) {
  try {
    await Promise.all([
      Activity.create({ ...input, targetTitle: input.targetTitle?.slice(0, 140) }),
      Board.updateOne({ _id: input.boardId }, { $set: { updatedAt: new Date() } }, { timestamps: false }),
    ]);
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}

type ActivityLike = {
  verb: string;
  targetType: string;
  targetTitle?: string;
};

/** Human sentence fragment after the actor's name, e.g. `added a claim "X"`. */
export function describeActivity(a: ActivityLike) {
  const title = a.targetTitle ? ` "${a.targetTitle}"` : "";
  const noun = a.targetType === "evidence" ? "evidence" : `a ${a.targetType}`;
  switch (a.verb) {
    case "created_board":
      return `created the board${title}`;
    case "updated_board":
      return "updated board settings";
    case "added":
      return a.targetType === "evidence" ? `connected evidence${title}` : `added ${noun}${title}`;
    case "updated":
      return `edited ${noun}${title}`;
    case "deleted":
      return `removed ${noun}${title}`;
    case "commented":
      return `commented on${title || " a card"}`;
    case "invited":
      return `invited ${a.targetTitle ?? "someone"}`;
    case "changed_role":
      return `changed the role of ${a.targetTitle ?? "a member"}`;
    case "removed_member":
      return `removed ${a.targetTitle ?? "a member"}`;
    default:
      return "made a change";
  }
}
