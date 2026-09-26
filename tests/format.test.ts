import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { escapeRegex, initials, plural, timeAgo } from "@/lib/format";

describe("timeAgo", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("describes recent times", () => {
    expect(timeAgo(new Date("2026-06-15T11:59:50Z"))).toBe("just now");
    expect(timeAgo(new Date("2026-06-15T11:50:00Z"))).toBe("10 min ago");
    expect(timeAgo(new Date("2026-06-15T09:00:00Z"))).toBe("3h ago");
    expect(timeAgo(new Date("2026-06-14T12:00:00Z"))).toBe("yesterday");
    expect(timeAgo(new Date("2026-06-11T12:00:00Z"))).toBe("4d ago");
  });

  it("falls back to a date for older items", () => {
    expect(timeAgo(new Date("2026-01-03T12:00:00Z"))).toBe("Jan 3");
    expect(timeAgo(new Date("2024-01-03T12:00:00Z"))).toBe("Jan 3, 2024");
  });
});

describe("text helpers", () => {
  it("builds initials", () => {
    expect(initials("Sai Sindu Sri")).toBe("SS");
    expect(initials("alex")).toBe("A");
    expect(initials(undefined)).toBe("?");
  });

  it("pluralizes", () => {
    expect(plural(1, "claim")).toBe("1 claim");
    expect(plural(3, "claim")).toBe("3 claims");
  });

  it("escapes regex characters in search input", () => {
    const escaped = escapeRegex("a.b*(c)");
    expect(new RegExp(escaped).test("a.b*(c)")).toBe(true);
    expect(new RegExp(escaped).test("axb")).toBe(false);
  });
});
