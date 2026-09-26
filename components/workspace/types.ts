import type { BoardRole, ClaimStatus, Relationship } from "@/lib/constants";

export type Pos = { x: number; y: number } | null;

export type ClaimData = {
  id: string;
  title: string;
  description?: string;
  tags: string[];
  status: ClaimStatus;
  authorName?: string;
  createdAt: string;
  position: Pos;
};

export type SourceData = {
  id: string;
  title: string;
  url?: string;
  sourceType: string;
  summary?: string;
  authorName?: string;
  createdAt: string;
  position: Pos;
};

export type NoteData = {
  id: string;
  content: string;
  authorName?: string;
  createdAt: string;
  position: Pos;
};

export type EvidenceData = {
  id: string;
  claimId: string;
  sourceId: string;
  relationship: Relationship;
  explanation?: string;
};

export type CommentData = {
  id: string;
  targetId: string;
  authorName: string;
  authorImage?: string;
  content: string;
  createdAt: string;
};

export type BoardData = {
  claims: ClaimData[];
  sources: SourceData[];
  notes: NoteData[];
  evidence: EvidenceData[];
  comments: CommentData[];
};

export type BoardInfo = {
  id: string;
  title: string;
  description?: string;
  isPublic: boolean;
};

export type Permissions = {
  signedIn: boolean;
  role: BoardRole | null;
  canEdit: boolean;
  canComment: boolean;
  isOwner: boolean;
};

export type CardType = "claim" | "source" | "note" | "evidence";
export type Selection = { type: CardType; id: string } | null;

/** What the compose panel is doing: adding a card, or editing one. */
export type Compose =
  | { kind: "claim" | "source" | "note"; editId?: string }
  | { kind: "evidence"; editId?: string; claimId?: string; sourceId?: string }
  | null;
