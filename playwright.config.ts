import { defineConfig, devices } from "@playwright/test";

// Locally, reuse .env.local; in CI the variables come from the workflow.
try {
  process.loadEnvFile(".env.local");
} catch {}

/**
 * End-to-end tests run against a production build on port 3100, using a
 * separate database so test accounts never touch your real data.
 * Override with E2E_MONGODB_URI; otherwise the database name in MONGODB_URI
 * is swapped for "warrant_e2e".
 */
function e2eDatabaseUrl() {
  if (process.env.E2E_MONGODB_URI) return process.env.E2E_MONGODB_URI;
  const base = process.env.MONGODB_URI;
  if (!base) throw new Error("Set E2E_MONGODB_URI or MONGODB_URI to run end-to-end tests.");
  // Mongo URIs can list several hosts, which the URL class can't parse, so
  // swap the database segment with a regex. Never echo the URI: it has a password.
  const match = base.match(/^(mongodb(?:\+srv)?:\/\/[^/?]+)(?:\/[^?]*)?(\?.*)?$/);
  if (!match) throw new Error("MONGODB_URI isn't a valid MongoDB connection string.");
  return `${match[1]}/warrant_e2e${match[2] ?? ""}`;
}

const PORT = 3100;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "phone", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    timeout: 300_000,
    reuseExistingServer: !process.env.CI,
    env: {
      MONGODB_URI: e2eDatabaseUrl(),
      NEXTAUTH_URL: `http://localhost:${PORT}`,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "e2e-only-secret-not-for-production",
      // GitHub sign-in isn't exercised in E2E.
      GITHUB_ID: "",
      GITHUB_SECRET: "",
    },
  },
});
