import mongoose, { Schema, models } from "mongoose";

const memberSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: {
      type: String,
      enum: ["editor", "commenter", "viewer"],
      default: "viewer",
    },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const boardSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    topic: {
      type: String,
      trim: true,
    },
    isPublic: {
      type: Boolean,
      default: false, // Boards are private by default to protect research
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User", // This strictly links the board to a document in the User collection
      required: true,
    },
    members: {
      type: [memberSchema],
      default: [],
    },
  },
  { timestamps: true } // Automatically manages createdAt and updatedAt fields
);

const Board = models.Board || mongoose.model("Board", boardSchema);

export default Board;
