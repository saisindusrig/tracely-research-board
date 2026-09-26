import { describe, expect, it } from "vitest";
import { handConnector, handEllipse, handHighlight, seeded, tiltFor } from "@/lib/rough";

// The hand-drawn look must be stable: the server and the browser have to
// produce identical SVG, and a card must not change tilt between renders.
describe("rough (hand-drawn geometry)", () => {
  it("produces the same numbers for the same seed", () => {
    const a = seeded("claim-42");
    const b = seeded("claim-42");
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it("produces different numbers for different seeds", () => {
    expect(seeded("a")()).not.toEqual(seeded("b")());
  });

  it("keeps numbers in [0, 1)", () => {
    const r = seeded("range");
    for (let i = 0; i < 500; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("gives each card a small, stable tilt", () => {
    const t = tiltFor("6ab76eb328cab7b937fb2efc");
    expect(t).toBe(tiltFor("6ab76eb328cab7b937fb2efc"));
    expect(Math.abs(t)).toBeGreaterThanOrEqual(0.3);
    expect(Math.abs(t)).toBeLessThanOrEqual(1.1);
  });

  it("draws identical paths for identical input", () => {
    const one = handConnector(0, 0, 100, 200, seeded("edge-1"));
    const two = handConnector(0, 0, 100, 200, seeded("edge-1"));
    expect(one).toEqual(two);
    expect(one.d.startsWith("M0 0 C")).toBe(true);
    expect(handEllipse(50, 20, 40, 15, seeded("x"))).toBe(handEllipse(50, 20, 40, 15, seeded("x")));
    expect(handHighlight(100, 20, seeded("y"))).toBe(handHighlight(100, 20, seeded("y")));
  });

  it("points the connector's arrow roughly toward the target", () => {
    const { endAngle } = handConnector(0, 0, 0, 300, seeded("down"));
    // Pointing downward: angle near +90 degrees.
    expect(endAngle).toBeGreaterThan(Math.PI / 4);
    expect(endAngle).toBeLessThan((3 * Math.PI) / 4);
  });
});
