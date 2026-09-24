import mongoose, { Schema, Document } from "mongoose";

export interface IEvidence extends Document {
  boardId: mongoose.Types.ObjectId;
  claimId: mongoose.Types.ObjectId;
  sourceId: mongoose.Types.ObjectId;
  relationship: string;
  explanation?: string;
}

const EvidenceSchema = new Schema(
  {
    boardId: { type: Schema.Types.ObjectId, ref: "Board", required: true },
    claimId: { type: Schema.Types.ObjectId, ref: "Claim", required: true },
    sourceId: { type: Schema.Types.ObjectId, ref: "Source", required: true },
    relationship: { 
      type: String, 
      enum: ["SUPPORTS", "CHALLENGES", "CONTEXT"], 
      required: true 
    },
    explanation: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Evidence || mongoose.model<IEvidence>("Evidence", EvidenceSchema);