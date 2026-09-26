import mongoose, { Schema, Document } from "mongoose";
import { RELATIONSHIPS } from "@/lib/constants";

export interface IEvidence extends Document {
  boardId: mongoose.Types.ObjectId;
  claimId: mongoose.Types.ObjectId;
  sourceId: mongoose.Types.ObjectId;
  relationship: string;
  explanation?: string;
  author?: mongoose.Types.ObjectId;
}

const EvidenceSchema = new Schema(
  {
    boardId: { type: Schema.Types.ObjectId, ref: "Board", required: true },
    claimId: { type: Schema.Types.ObjectId, ref: "Claim", required: true },
    sourceId: { type: Schema.Types.ObjectId, ref: "Source", required: true },
    relationship: {
      type: String,
      enum: [...RELATIONSHIPS],
      required: true,
    },
    explanation: { type: String, trim: true },
    author: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// One link per claim/source pair on a board.
EvidenceSchema.index({ boardId: 1, claimId: 1, sourceId: 1 }, { unique: true });

export default mongoose.models.Evidence || mongoose.model<IEvidence>("Evidence", EvidenceSchema);
