import mongoose, { Schema, models } from "mongoose";

const claimSchema = new Schema(
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
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ["UNVERIFIED", "VERIFIED", "DISPUTED"],
      default: "UNVERIFIED",
    },
    
    boardId: {
      type: Schema.Types.ObjectId,
      ref: "Boards", 
      required: true,
    },

    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true } 
);

const Claim = models.Claim || mongoose.model("Claim", claimSchema);

export default Claim;