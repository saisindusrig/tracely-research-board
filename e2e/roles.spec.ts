import { expect, test, type Browser, type Page } from "@playwright/test";

// Desktop layout only; the phone run of the main flow covers mobile.
test.skip(({ viewport }) => (viewport?.width ?? 1280) < 768, "desktop only");

/** Creates an account through the API and logs in through the real form. */
async function signedInPage(browser: Browser, tag: string): Promise<{ page: Page; username: string }> {
  const context = await browser.newContext();
  const page = await context.newPage();
  const username = `e2e_${tag}`;
  const email = `${username}@example.test`;
  const password = `pw-${tag}-e2e`;
  const res = await page.request.post("/api/register", {
    data: { name: `Tester ${tag}`, username, email, password },
  });
  expect(res.status()).toBe(201);
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  return { page, username };
}

test("owners invite collaborators, and roles limit what they can do", async ({ browser }) => {
  const run = Date.now().toString(36);
  const owner = await signedInPage(browser, `${run}o`);
  const commenter = await signedInPage(browser, `${run}c`);
  const stranger = await signedInPage(browser, `${run}s`);

  // Owner creates a private board with one claim
  await owner.page.goto("/boards/new");
  await owner.page.getByLabel("Board name", { exact: true }).fill("E2E: private roles board");
  await owner.page.getByRole("button", { name: "Create board" }).click();
  await expect(owner.page).toHaveURL(/\/boards\/[a-f0-9]{24}/);
  const boardUrl = new URL(owner.page.url()).pathname;
  await owner.page.getByRole("button", { name: "Add a claim" }).click();
  await owner.page.locator("#claim-title").fill("Private claim under review");
  await owner.page.getByRole("button", { name: "Add claim" }).click();
  await expect(owner.page.getByText("Claim added to the board.")).toBeVisible();

  // A stranger can't open it
  await stranger.page.goto(boardUrl);
  await expect(stranger.page.getByRole("heading", { name: "This board is private." })).toBeVisible();

  // Owner invites the commenter by username
  await owner.page.goto(`${boardUrl}/members`);
  await owner.page.getByLabel("Invite people").fill(`@${commenter.username}`);
  await owner.page.getByLabel("Role", { exact: true }).selectOption("commenter");
  await owner.page.getByRole("button", { name: "Invite", exact: true }).click();
  await expect(owner.page.getByText(/can now comment on this board/)).toBeVisible();

  // The commenter can read and comment, but has no editing tools
  await commenter.page.goto(boardUrl);
  const canvas = commenter.page.getByLabel("Research canvas");
  await expect(canvas.getByText("Private claim under review")).toBeVisible();
  await expect(commenter.page.getByText("View only", { exact: true })).toBeVisible();
  await expect(commenter.page.getByRole("button", { name: /^Claim/ })).toHaveCount(0);
  await canvas.getByText("Private claim under review").click();
  const panel = commenter.page.getByRole("complementary", { name: "Card details" });
  await expect(panel.getByRole("button", { name: "Edit" })).toHaveCount(0);
  await panel.getByLabel("Add a comment").fill("Which sample size did this use?");
  await panel.getByRole("button", { name: "Comment", exact: true }).click();
  await expect(commenter.page.getByText("Comment posted.")).toBeVisible();
  await expect(panel.getByText("Which sample size did this use?")).toBeVisible();

  // The owner sees it in history and gets a notification
  await owner.page.goto(`${boardUrl}/history`);
  await expect(owner.page.getByText(/commented on "Private claim under review"/)).toBeVisible();
  await owner.page.getByRole("button", { name: /Notifications/ }).click();
  await expect(owner.page.getByText(/commented on "Private claim under review"/).last()).toBeVisible();
});
