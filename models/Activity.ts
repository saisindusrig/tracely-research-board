import mongoose, { Schema, models } from "mongoose";

// One row per meaningful change on a board. Powers board history,
// the dashboard activity feed and notifications.
export const ACTIVITY_VERBS = [
  "created_board",
  "updated_board",
  "added",
  "updated",
  "deleted",
  "commented",
  "invited",
  "changed_role",
  "removed_member",
] as const;

const activitySchema = new Schema(
  {
    boardId: { type: Schema.Types.ObjectId, ref: "Board", required: true, index: true },
    actor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    verb: { type: String, enum: [...ACTIVITY_VERBS], required: true },
    targetType: {
      type: String,
      enum: ["board", "claim", "source", "evidence", "note", "member"],
      required: true,
    },
    targetTitle: { type: String, trim: true },
    // Set for member events so the invited person can be notified.
    targetUser: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

activitySchema.index({ boardId: 1, createdAt: -1 });

export default models.Activity || mongoose.model("Activity", activitySchema);
