import mongoose, { Schema, models } from "mongoose";

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // Public handle used for /profile/[username]. Sparse so older accounts
    // without one don't collide on the unique index.
    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 280,
    },
    image: {
      type: String,
    },
    // Not required: accounts created through GitHub sign-in have no password.
    password: {
      type: String,
      select: false,
    },
    notificationsSeenAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const User = models.User || mongoose.model("User", userSchema);
export default User;
