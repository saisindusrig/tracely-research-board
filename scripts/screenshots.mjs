// Captures desktop and phone screenshots of the main pages.
//
//   node --env-file=.env.local scripts/screenshots.mjs [baseUrl] [outDir]
//
// Defaults: http://localhost:3000 and docs/screenshots. Signed-in pages use
// the demo account from `npm run seed` (SEED_DEMO_PASSWORD).
import { chromium, devices } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

const base = process.argv[2] ?? "http://localhost:3000";
const out = process.argv[3] ?? "docs/screenshots";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();

for (const [label, options] of [
  ["desktop", { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }],
  ["phone", { ...devices["Pixel 7"], deviceScaleFactor: 1 }],
]) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  const shot = async (name, url, { full = true } = {}) => {
    await page.goto(new URL(url, base).toString(), { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(out, `${name}-${label}.png`), fullPage: full });
    const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    console.log(`saved ${name}-${label}.png${sw > cw ? `  WARNING: scrolls sideways (${sw}px > ${cw}px)` : ""}`);
  };

  await shot("home", "/");
  await shot("explore", "/explore");
  await shot("login", "/login");
  await shot("not-found", "/this-page-does-not-exist");
  await shot("register", "/register");
  await shot("search", "/search?q=sleep");
  await shot("profile", "/profile/demo");

  // A public demo board, opened as a visitor.
  await page.goto(new URL("/explore", base).toString());
  const boardHref = await page.locator('a[href^="/boards/"]').first().getAttribute("href");
  if (boardHref) await shot("board", boardHref, { full: false });

  if (process.env.SEED_DEMO_PASSWORD) {
    await page.goto(new URL("/login", base).toString());
    await page.getByLabel("Email", { exact: true }).fill("demo@warrant.dev");
    await page.getByLabel("Password", { exact: true }).fill(process.env.SEED_DEMO_PASSWORD);
    await page.getByRole("button", { name: "Log in", exact: true }).click();
    await page.waitForURL(/dashboard/, { timeout: 15000 }).catch(() => console.log("demo login failed; run npm run seed"));
    await shot("dashboard", "/dashboard");
    await shot("boards", "/boards");
    await shot("new-board", "/boards/new");
    await shot("settings", "/settings");
    if (boardHref) {
      await shot("board-members", `${boardHref}/members`);
      await shot("board-settings", `${boardHref}/settings`);
      await shot("board-owner", boardHref, { full: false });
      await shot("board-history", `${boardHref}/history`);
    }
  }
  await context.close();
}

await browser.close();
