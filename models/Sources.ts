import mongoose, { Schema, Document } from "mongoose";
import { SOURCE_TYPES } from "@/lib/constants";

export interface ISource extends Document {
  boardId: mongoose.Types.ObjectId;
  title: string;
  url?: string;
  sourceType: string;
  summary?: string;
  author?: mongoose.Types.ObjectId;
  position?: { x?: number; y?: number };
}

const SourceSchema = new Schema(
  {
    boardId: { type: Schema.Types.ObjectId, ref: "Board", required: true },
    title: { type: String, required: true, trim: true },
    url: { type: String, trim: true },
    summary: { type: String, trim: true },
    sourceType: {
      type: String,
      enum: [...SOURCE_TYPES],
      default: "Website",
    },
    author: { type: Schema.Types.ObjectId, ref: "User" },
    position: {
      x: { type: Number },
      y: { type: Number },
    },
  },
  { timestamps: true }
);

SourceSchema.index({ boardId: 1, createdAt: 1 });

export default mongoose.models.Source || mongoose.model<ISource>("Source", SourceSchema);
