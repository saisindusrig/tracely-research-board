import { describe, expect, it } from "vitest";
import { cleanPosition, cleanTags, cleanUrl, permissionsFor, resolveRole } from "@/lib/validation";
import { USERNAME_PATTERN } from "@/lib/constants";

describe("cleanUrl", () => {
  it("keeps valid http(s) links", () => {
    expect(cleanUrl("https://example.com/paper")).toEqual({ url: "https://example.com/paper" });
  });

  it("adds https:// when the scheme is missing", () => {
    expect(cleanUrl("example.org/study").url).toBe("https://example.org/study");
  });

  it("treats blank input as no link", () => {
    expect(cleanUrl("   ")).toEqual({ url: undefined });
    expect(cleanUrl(undefined)).toEqual({ url: undefined });
  });

  it("rejects javascript: and other non-web schemes", () => {
    expect(cleanUrl("javascript:alert(1)").error).toBeDefined();
    expect(cleanUrl("ftp://example.com").error).toBeDefined();
  });

  it("rejects text that isn't a web address", () => {
    expect(cleanUrl("not a link").error).toBeDefined();
  });
});

describe("cleanTags", () => {
  it("lowercases, strips # and removes duplicates", () => {
    expect(cleanTags(["#AI", "ai", " Health "])).toEqual(["ai", "health"]);
  });

  it("caps the number and length of tags", () => {
    const many = Array.from({ length: 12 }, (_, i) => `tag${i}`);
    expect(cleanTags(many)).toHaveLength(8);
    expect(cleanTags(["x".repeat(50)])[0]).toHaveLength(32);
  });

  it("drops empty entries", () => {
    expect(cleanTags(["", "  ", "#"])).toEqual([]);
  });
});

describe("cleanPosition", () => {
  it("rounds valid coordinates", () => {
    expect(cleanPosition({ x: 10.6, y: -3.2 })).toEqual({ x: 11, y: -3 });
  });

  it("rejects missing or non-finite values", () => {
    expect(cleanPosition(undefined)).toBeUndefined();
    expect(cleanPosition({ x: NaN, y: 1 })).toBeUndefined();
    expect(cleanPosition({ x: Infinity, y: 1 })).toBeUndefined();
  });
});

describe("board roles and permissions", () => {
  const board = {
    owner: "owner1",
    members: [
      { user: "editor1", role: "editor" as const },
      { user: "commenter1", role: "commenter" as const },
      { user: "viewer1", role: "viewer" as const },
    ],
  };

  it("resolves each person's role", () => {
    expect(resolveRole(board, "owner1")).toBe("owner");
    expect(resolveRole(board, "editor1")).toBe("editor");
    expect(resolveRole(board, "viewer1")).toBe("viewer");
    expect(resolveRole(board, "stranger")).toBeNull();
    expect(resolveRole(board, null)).toBeNull();
  });

  it.each([
    // role,        public, view,  comment, edit,  owner
    ["owner", false, true, true, true, true],
    ["editor", false, true, true, true, false],
    ["commenter", false, true, true, false, false],
    ["viewer", false, true, false, false, false],
    [null, false, false, false, false, false],
    [null, true, true, false, false, false],
  ] as const)("role %s on public=%s", (role, isPublic, canView, canComment, canEdit, isOwner) => {
    expect(permissionsFor(role, isPublic)).toEqual({ canView, canComment, canEdit, isOwner });
  });
});

describe("username rules", () => {
  it("accepts lowercase letters, numbers and underscores", () => {
    expect(USERNAME_PATTERN.test("sai_sindu2")).toBe(true);
  });

  it("rejects short, long, uppercase or symbol usernames", () => {
    for (const bad of ["ab", "a".repeat(25), "Sai", "sai-sindu", "sai sindu"]) {
      expect(USERNAME_PATTERN.test(bad)).toBe(false);
    }
  });
});
