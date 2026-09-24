import mongoose, { Schema, Document } from "mongoose";

export interface ISource extends Document {
  boardId: mongoose.Types.ObjectId;
  title: string;
  url?: string;
  sourceType: string;
}

const SourceSchema = new Schema(
  {
    boardId: { type: Schema.Types.ObjectId, ref: "Board", required: true },
    title: { type: String, required: true },
    url: { type: String },
    sourceType: { 
      type: String, 
      enum: ["Paper", "Article", "Website", "Video", "Dataset"], 
      default: "Website" 
    },
  },
  { timestamps: true }
);

export default mongoose.models.Source || mongoose.model<ISource>("Source", SourceSchema);