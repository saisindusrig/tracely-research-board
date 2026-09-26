import mongoose, { Schema, models } from "mongoose";

const noteSchema = new Schema(
  {
    boardId: {
      type: Schema.Types.ObjectId,
      ref: "Board",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    position: {
      x: { type: Number },
      y: { type: Number },
    },
  },
  { timestamps: true }
);

noteSchema.index({ boardId: 1, createdAt: 1 });

export default models.Note || mongoose.model("Note", noteSchema);
