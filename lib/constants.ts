// Plain constants shared by server and client code. Keep this file free of
// database imports so client components can use it.

export const TOPICS = [
  "AI",
  "Psychology",
  "Science",
  "Technology",
  "Health",
  "Climate",
  "Economics",
  "Education",
  "Policy",
  "Other",
] as const;

export const SOURCE_TYPES = ["Paper", "Article", "Website", "Video", "Dataset", "Other"] as const;

export const RELATIONSHIPS = ["SUPPORTS", "CHALLENGES", "CONTEXT"] as const;
export type Relationship = (typeof RELATIONSHIPS)[number];

export const CLAIM_STATUSES = ["UNVERIFIED", "VERIFIED", "DISPUTED"] as const;
export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

export const MEMBER_ROLES = ["editor", "commenter", "viewer"] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number];
export type BoardRole = "owner" | MemberRole;

export const ROLE_DESCRIPTIONS: Record<BoardRole, string> = {
  owner: "Full control, including settings and members",
  editor: "Can add, edit and connect cards",
  commenter: "Can view and comment",
  viewer: "Can view only",
};

export const USERNAME_PATTERN = /^[a-z0-9_]{3,24}$/;
