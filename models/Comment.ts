import mongoose, { Schema, models } from "mongoose";

const commentSchema = new Schema(
  {
    boardId: { type: Schema.Types.ObjectId, ref: "Board", required: true, index: true },
    targetType: {
      type: String,
      enum: ["claim", "source", "note", "evidence"],
      required: true,
    },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

export default models.Comment || mongoose.model("Comment", commentSchema);
