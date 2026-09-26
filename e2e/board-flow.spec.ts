import { expect, test, type Page } from "@playwright/test";

/**
 * The core research loop, run on desktop and on a phone-sized screen:
 * sign up, create a board, add a claim and a source, connect them as
 * evidence, and inspect the claim.
 */

async function noSidewaysScroll(page: Page) {
  const { scroll, client } = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(scroll, "page should not scroll sideways").toBeLessThanOrEqual(client);
}

test("sign up, build a board and connect evidence", async ({ page }) => {
  const isPhone = (page.viewportSize()?.width ?? 1280) < 768;
  // On phones the add tools live in a bottom bar; on desktop in the left rail.
  const tool = (name: string) =>
    isPhone
      ? page.getByRole("navigation", { name: "Add to board" }).getByRole("button", { name })
      : page.getByRole("button", { name: new RegExp(`^${name}`) });

  const id = `${Date.now().toString(36)}${isPhone ? "m" : "d"}`;
  const email = `e2e_${id}@example.test`;
  const password = `pw-${id}-e2e`;

  // Register
  await page.goto("/register");
  await noSidewaysScroll(page);
  await page.getByLabel("Name", { exact: true }).fill("E2E Tester");
  await page.getByLabel("Username", { exact: true }).fill(`e2e_${id}`);
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByText("Account created. Log in to get started.")).toBeVisible();

  // Log in
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await noSidewaysScroll(page);

  // Create a board
  await page.goto("/boards/new");
  await page.getByLabel("Board name", { exact: true }).fill("E2E: does coffee help focus?");
  await page.getByRole("button", { name: "Create board" }).click();
  await expect(page).toHaveURL(/\/boards\/[a-f0-9]{24}/);
  await expect(page.getByRole("heading", { name: "E2E: does coffee help focus?" })).toBeVisible();
  await noSidewaysScroll(page);

  // Add a claim
  await tool("Claim").click();
  await page.locator("#claim-title").fill("Coffee improves short-term focus");
  await page.getByRole("button", { name: "Add claim" }).click();
  await expect(page.getByText("Claim added to the board.")).toBeVisible();
  const canvas = page.getByLabel("Research canvas");
  const claim = canvas.getByText("Coffee improves short-term focus");
  await expect(claim).toBeVisible();

  // Add a source, written without https:// on purpose
  await tool("Source").click();
  await page.locator("#source-title").fill("Caffeine and attention meta-analysis");
  await page.locator("#source-url").fill("example.com/caffeine");
  await page.getByRole("button", { name: "Add source" }).click();
  const source = canvas.getByText("Caffeine and attention meta-analysis");
  await expect(source).toBeVisible();
  // New cards must not be stacked on top of each other
  const [a, b] = [await claim.boundingBox(), await source.boundingBox()];
  expect(a && b && (a.y + a.height <= b.y || b.y + b.height <= a.y || a.x + a.width <= b.x || b.x + b.width <= a.x)).toBeTruthy();
  // and the newest one is scrolled into view
  await expect(source).toBeInViewport();

  // Connect them as supporting evidence
  await tool("Evidence").click();
  await page.getByRole("button", { name: "Connect", exact: true }).click();
  await expect(page.getByText("Evidence connected.")).toBeVisible();
  await expect(canvas.getByRole("button", { name: "Evidence: supports" })).toBeVisible();

  // The claim's detail panel lists the linked source
  await claim.click();
  const panel = page.getByRole("complementary", { name: "Card details" });
  await expect(panel.getByRole("button", { name: /Caffeine and attention meta-analysis/ })).toBeVisible();
  await noSidewaysScroll(page);
});
