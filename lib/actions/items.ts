"use server";

import { revalidatePath } from "next/cache";
import { isValidObjectId } from "mongoose";
import { requireBoard } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import {
  CLAIM_STATUSES,
  RELATIONSHIPS,
  SOURCE_TYPES,
  type ClaimStatus,
  type Relationship,
} from "@/lib/constants";
import type { ActionResult } from "@/lib/actions/boards";
import { cleanPosition, cleanTags, cleanUrl } from "@/lib/validation";
import Claim from "@/models/Claim";
import Source from "@/models/Sources";
import Evidence from "@/models/Evidence";
import Note from "@/models/Note";
import Comment from "@/models/Comment";

export type ItemType = "claim" | "source" | "note" | "evidence";
type Position = { x: number; y: number };

const MODELS = { claim: Claim, source: Source, note: Note, evidence: Evidence } as const;

function refresh(boardId: string) {
  revalidatePath(`/boards/${boardId}`);
}

// ---------------------------------------------------------------- create

export async function createClaim(
  boardId: string,
  input: { title: string; description?: string; tags?: string[]; position?: Position }
): Promise<ActionResult> {
  const guard = await requireBoard(boardId, "edit");
  if ("error" in guard) return { ok: false, error: guard.error as string };

  const title = input.title?.trim();
  if (!title) return { ok: false, error: "Write the claim you want to investigate." };

  try {
    const claim = await Claim.create({
      boardId,
      title,
      description: input.description?.trim() || undefined,
      tags: cleanTags(input.tags),
      author: guard.user.id,
      position: cleanPosition(input.position),
    });
    await logActivity({ boardId, actor: guard.user.id, verb: "added", targetType: "claim", targetTitle: claim.title });
    refresh(boardId);
    return { ok: true };
  } catch (error) {
    console.error("Failed to create claim:", error);
    return { ok: false, error: "Couldn't add the claim. Please try again." };
  }
}

export async function createSource(
  boardId: string,
  input: { title: string; url?: string; sourceType?: string; summary?: string; position?: Position }
): Promise<ActionResult> {
  const guard = await requireBoard(boardId, "edit");
  if ("error" in guard) return { ok: false, error: guard.error as string };

  const title = input.title?.trim();
  if (!title) return { ok: false, error: "Give the source a title." };
  const link = cleanUrl(input.url);
  if (link.error) return { ok: false, error: link.error };
  const sourceType = SOURCE_TYPES.includes(input.sourceType as (typeof SOURCE_TYPES)[number])
    ? input.sourceType
    : "Website";

  try {
    const source = await Source.create({
      boardId,
      title,
      url: link.url,
      sourceType,
      summary: input.summary?.trim() || undefined,
      author: guard.user.id,
      position: cleanPosition(input.position),
    });
    await logActivity({ boardId, actor: guard.user.id, verb: "added", targetType: "source", targetTitle: source.title });
    refresh(boardId);
    return { ok: true };
  } catch (error) {
    console.error("Failed to create source:", error);
    return { ok: false, error: "Couldn't add the source. Please try again." };
  }
}

export async function createNote(
  boardId: string,
  input: { content: string; position?: Position }
): Promise<ActionResult> {
  const guard = await requireBoard(boardId, "edit");
  if ("error" in guard) return { ok: false, error: guard.error as string };

  const content = input.content?.trim();
  if (!content) return { ok: false, error: "The note is empty." };

  try {
    await Note.create({ boardId, content, author: guard.user.id, position: cleanPosition(input.position) });
    await logActivity({
      boardId,
      actor: guard.user.id,
      verb: "added",
      targetType: "note",
      targetTitle: content.slice(0, 60),
    });
    refresh(boardId);
    return { ok: true };
  } catch (error) {
    console.error("Failed to create note:", error);
    return { ok: false, error: "Couldn't save the note. Please try again." };
  }
}

export async function createEvidence(
  boardId: string,
  input: { claimId: string; sourceId: string; relationship: Relationship; explanation?: string }
): Promise<ActionResult> {
  const guard = await requireBoard(boardId, "edit");
  if ("error" in guard) return { ok: false, error: guard.error as string };

  if (!RELATIONSHIPS.includes(input.relationship)) return { ok: false, error: "Pick a relationship." };
  if (!isValidObjectId(input.claimId) || !isValidObjectId(input.sourceId)) {
    return { ok: false, error: "Pick a claim and a source to connect." };
  }

  const [claim, source] = await Promise.all([
    Claim.findOne({ _id: input.claimId, boardId }).select("title"),
    Source.findOne({ _id: input.sourceId, boardId }).select("title"),
  ]);
  if (!claim || !source) return { ok: false, error: "That claim or source is no longer on this board." };

  const duplicate = await Evidence.exists({ boardId, claimId: claim._id, sourceId: source._id });
  if (duplicate) return { ok: false, error: "These two are already connected. Edit the existing link instead." };

  try {
    await Evidence.create({
      boardId,
      claimId: claim._id,
      sourceId: source._id,
      relationship: input.relationship,
      explanation: input.explanation?.trim() || undefined,
      author: guard.user.id,
    });
    await logActivity({
      boardId,
      actor: guard.user.id,
      verb: "added",
      targetType: "evidence",
      targetTitle: `${source.title} ${input.relationship.toLowerCase()} ${claim.title}`,
    });
    refresh(boardId);
    return { ok: true };
  } catch (error) {
    console.error("Failed to create evidence:", error);
    return { ok: false, error: "Couldn't connect the evidence. Please try again." };
  }
}

// ---------------------------------------------------------------- update

type ItemPatch = {
  title?: string;
  description?: string;
  tags?: string[];
  status?: ClaimStatus;
  url?: string;
  sourceType?: string;
  summary?: string;
  content?: string;
  relationship?: Relationship;
  explanation?: string;
};

export async function updateItem(
  boardId: string,
  type: ItemType,
  id: string,
  patch: ItemPatch
): Promise<ActionResult> {
  const guard = await requireBoard(boardId, "edit");
  if ("error" in guard) return { ok: false, error: guard.error as string };
  if (!isValidObjectId(id) || !(type in MODELS)) return { ok: false, error: "That card no longer exists." };

  const set: Record<string, unknown> = {};

  if (type === "claim") {
    if (patch.title !== undefined) {
      if (!patch.title.trim()) return { ok: false, error: "A claim needs a title." };
      set.title = patch.title.trim();
    }
    if (patch.description !== undefined) set.description = patch.description.trim();
    if (patch.tags !== undefined) set.tags = cleanTags(patch.tags);
    if (patch.status !== undefined) {
      if (!CLAIM_STATUSES.includes(patch.status)) return { ok: false, error: "Unknown status." };
      set.status = patch.status;
    }
  } else if (type === "source") {
    if (patch.title !== undefined) {
      if (!patch.title.trim()) return { ok: false, error: "A source needs a title." };
      set.title = patch.title.trim();
    }
    if (patch.url !== undefined) {
      const link = cleanUrl(patch.url);
      if (link.error) return { ok: false, error: link.error };
      set.url = link.url ?? "";
    }
    if (patch.sourceType !== undefined && SOURCE_TYPES.includes(patch.sourceType as (typeof SOURCE_TYPES)[number])) {
      set.sourceType = patch.sourceType;
    }
    if (patch.summary !== undefined) set.summary = patch.summary.trim();
  } else if (type === "note") {
    if (patch.content !== undefined) {
      if (!patch.content.trim()) return { ok: false, error: "The note is empty." };
      set.content = patch.content.trim();
    }
  } else if (type === "evidence") {
    if (patch.relationship !== undefined) {
      if (!RELATIONSHIPS.includes(patch.relationship)) return { ok: false, error: "Pick a relationship." };
      set.relationship = patch.relationship;
    }
    if (patch.explanation !== undefined) set.explanation = patch.explanation.trim();
  }

  if (Object.keys(set).length === 0) return { ok: true };

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const model = MODELS[type] as any;
    const doc = await model.findOneAndUpdate({ _id: id, boardId }, { $set: set }, { returnDocument: "after" });
    if (!doc) return { ok: false, error: "That card no longer exists." };
    await logActivity({
      boardId,
      actor: guard.user.id,
      verb: "updated",
      targetType: type,
      targetTitle: doc.title ?? doc.content?.slice(0, 60) ?? doc.relationship?.toLowerCase(),
    });
    refresh(boardId);
    return { ok: true };
  } catch (error) {
    console.error("Failed to update item:", error);
    return { ok: false, error: "Couldn't save changes. Please try again." };
  }
}

export async function deleteItem(boardId: string, type: ItemType, id: string): Promise<ActionResult> {
  const guard = await requireBoard(boardId, "edit");
  if ("error" in guard) return { ok: false, error: guard.error as string };
  if (!isValidObjectId(id) || !(type in MODELS)) return { ok: false, error: "That card no longer exists." };

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const model = MODELS[type] as any;
    const doc = await model.findOneAndDelete({ _id: id, boardId });
    if (!doc) return { ok: false, error: "That card was already removed." };

    // Remove anything hanging off the deleted card.
    const cleanup: Promise<unknown>[] = [Comment.deleteMany({ boardId, targetId: id })];
    if (type === "claim") cleanup.push(Evidence.deleteMany({ boardId, claimId: id }));
    if (type === "source") cleanup.push(Evidence.deleteMany({ boardId, sourceId: id }));
    await Promise.all(cleanup);

    await logActivity({
      boardId,
      actor: guard.user.id,
      verb: "deleted",
      targetType: type,
      targetTitle: doc.title ?? doc.content?.slice(0, 60),
    });
    refresh(boardId);
    return { ok: true };
  } catch (error) {
    console.error("Failed to delete item:", error);
    return { ok: false, error: "Couldn't remove the card. Please try again." };
  }
}

/** Saves where a card sits on the canvas. Silent: no activity row, no refresh. */
export async function saveNodePosition(
  boardId: string,
  type: Exclude<ItemType, "evidence">,
  id: string,
  position: Position
): Promise<ActionResult> {
  const guard = await requireBoard(boardId, "edit");
  if ("error" in guard) return { ok: false, error: guard.error as string };
  const pos = cleanPosition(position);
  if (!pos || !isValidObjectId(id) || !["claim", "source", "note"].includes(type)) {
    return { ok: false, error: "Invalid position." };
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const model = MODELS[type] as any;
  await model.updateOne({ _id: id, boardId }, { $set: { position: pos } });
  return { ok: true };
}

// ---------------------------------------------------------------- comments

export async function addComment(
  boardId: string,
  targetType: ItemType,
  targetId: string,
  content: string
): Promise<ActionResult> {
  const guard = await requireBoard(boardId, "comment");
  if ("error" in guard) return { ok: false, error: guard.error as string };

  const text = content?.trim();
  if (!text) return { ok: false, error: "Write something first." };
  if (text.length > 2000) return { ok: false, error: "Comments can be up to 2,000 characters." };
  if (!isValidObjectId(targetId) || !(targetType in MODELS)) return { ok: false, error: "That card no longer exists." };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const target = await (MODELS[targetType] as any).findOne({ _id: targetId, boardId }).select("title content");
  if (!target) return { ok: false, error: "That card no longer exists." };

  try {
    await Comment.create({ boardId, targetType, targetId, author: guard.user.id, content: text });
    await logActivity({
      boardId,
      actor: guard.user.id,
      verb: "commented",
      targetType,
      targetTitle: target.title ?? target.content?.slice(0, 60),
    });
    refresh(boardId);
    return { ok: true };
  } catch (error) {
    console.error("Failed to add comment:", error);
    return { ok: false, error: "Couldn't post the comment. Please try again." };
  }
}
