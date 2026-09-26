// Pure input-cleaning and permission rules. No database access here, so
// everything in this file is easy to unit test (see tests/validation.test.ts).
import type { BoardRole } from "@/lib/constants";

export type Position = { x: number; y: number };

/** Rounds a canvas position, or returns undefined if it isn't a real point. */
export function cleanPosition(p?: Partial<Position> | null) {
  if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return undefined;
  return { x: Math.round(p.x as number), y: Math.round(p.y as number) };
}

/**
 * Normalizes a user-entered link. Adds https:// when missing and rejects
 * anything that isn't http(s), such as `javascript:` URLs.
 */
export function cleanUrl(url?: string): { url?: string; error?: string } {
  const value = url?.trim();
  if (!value) return { url: undefined };
  try {
    const parsed = new URL(/^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`);
    if (!["http:", "https:"].includes(parsed.protocol) || !parsed.hostname.includes(".")) throw new Error();
    return { url: parsed.toString() };
  } catch {
    return { error: "That link doesn't look like a valid web address." };
  }
}

/** Lowercases, strips `#`, de-duplicates and caps tags at 8 of 32 chars each. */
export function cleanTags(tags?: string[]) {
  return Array.from(
    new Set(
      (tags ?? [])
        .map((t) => t.trim().replace(/^#+/, "").toLowerCase())
        .filter(Boolean)
        .map((t) => t.slice(0, 32))
    )
  ).slice(0, 8);
}

type BoardLike = {
  owner: { toString(): string };
  members?: { user: { toString(): string }; role: BoardRole }[];
  isPublic?: boolean;
};

/** The user's role on a board, or null if they have none. */
export function resolveRole(board: BoardLike, userId?: string | null): BoardRole | null {
  if (!userId) return null;
  if (board.owner.toString() === userId) return "owner";
  return board.members?.find((m) => m.user.toString() === userId)?.role ?? null;
}

/** What a role can do. Public boards are viewable by anyone, roles or not. */
export function permissionsFor(role: BoardRole | null, isPublic: boolean) {
  return {
    canView: role !== null || isPublic,
    canEdit: role === "owner" || role === "editor",
    canComment: role === "owner" || role === "editor" || role === "commenter",
    isOwner: role === "owner",
  };
}
