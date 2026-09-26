import { Types, type Model } from "mongoose";
import Claim from "@/models/Claim";
import Source from "@/models/Sources";
import Comment from "@/models/Comment";

export type BoardStats = { claims: number; sources: number; comments: number };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function countBy(model: Model<any>, ids: Types.ObjectId[]) {
  const rows: { _id: Types.ObjectId; n: number }[] = await model.aggregate([
    { $match: { boardId: { $in: ids } } },
    { $group: { _id: "$boardId", n: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [r._id.toString(), r.n]));
}

/** Claim, source and comment counts for many boards in three queries. */
export async function getBoardStats(boardIds: (string | Types.ObjectId)[]) {
  const ids = boardIds.map((id) => new Types.ObjectId(id.toString()));
  const [claims, sources, comments] = await Promise.all([
    countBy(Claim, ids),
    countBy(Source, ids),
    countBy(Comment, ids),
  ]);
  const stats = new Map<string, BoardStats>();
  for (const id of ids) {
    const key = id.toString();
    stats.set(key, {
      claims: claims.get(key) ?? 0,
      sources: sources.get(key) ?? 0,
      comments: comments.get(key) ?? 0,
    });
  }
  return stats;
}
