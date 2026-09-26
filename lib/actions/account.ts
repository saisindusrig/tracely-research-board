"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";
import { USERNAME_PATTERN } from "@/lib/constants";
import type { ActionResult } from "@/lib/actions/boards";
import User from "@/models/User";

export async function updateProfile(input: {
  name: string;
  username: string;
  bio?: string;
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in to continue." };

  const name = input.name?.trim();
  const username = input.username?.trim().toLowerCase().replace(/^@/, "");
  const bio = input.bio?.trim() ?? "";

  if (!name) return { ok: false, error: "Your name can't be empty." };
  if (!USERNAME_PATTERN.test(username)) {
    return { ok: false, error: "Usernames use 3 to 24 lowercase letters, numbers or underscores." };
  }
  if (bio.length > 280) return { ok: false, error: "Keep your bio under 280 characters." };

  await connectToDatabase();
  const taken = await User.exists({ username, _id: { $ne: user.id } });
  if (taken) return { ok: false, error: "That username is taken. Try another." };

  await User.updateOne({ _id: user.id }, { $set: { name, username, bio } });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function markNotificationsSeen(): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in to continue." };
  await connectToDatabase();
  await User.updateOne({ _id: user.id }, { $set: { notificationsSeenAt: new Date() } });
  return { ok: true };
}
