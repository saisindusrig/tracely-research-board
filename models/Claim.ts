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
      ref: "Board",
      required: true,
    },

    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Canvas placement, saved when the card is dragged.
    position: {
      x: { type: Number },
      y: { type: Number },
    },
  },
  { timestamps: true }
);

claimSchema.index({ boardId: 1, createdAt: 1 });

const Claim = models.Claim || mongoose.model("Claim", claimSchema);

export default Claim;
