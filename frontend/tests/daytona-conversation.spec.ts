import { test, expect } from "@playwright/test";

/**
 * Daytona Conversation E2E Tests
 *
 * These tests verify the complete user flow for creating conversations
 * that trigger Daytona sandbox creation.
 *
 * Prerequisites:
 * - Backend running with RUNTIME=daytona
 * - Valid DAYTONA_API_KEY configured
 * - Frontend running or accessible
 *
 * Note: These tests require authentication. In CI, use mock auth or
 * configure test credentials via environment variables.
 */

// Configuration
const BACKEND_URL =
  process.env.VITE_BACKEND_BASE_URL ||
  "https://openhands-production-c7c2.up.railway.app";
const FRONTEND_URL =
  process.env.FRONTEND_URL || "https://frontend-ten-beta-79.vercel.app";

test.describe("Daytona Conversation Flow", () => {
  test.describe.configure({ mode: "serial" });

  test("backend health check", async ({ request }) => {
    // Verify backend is running and Atoms Plus is enabled
    const response = await request.get(`${BACKEND_URL}/atoms-plus`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.name).toBe("Atoms Plus");
    expect(data.version).toBe("0.3.0");
    expect(data.features).toHaveLength(4);
  });

  test("web client config is accessible", async ({ request }) => {
    const response = await request.get(
      `${BACKEND_URL}/api/v1/web-client/config`
    );
    expect(response.ok()).toBeTruthy();

    const config = await response.json();
    expect(config).toBeDefined();
  });

  test("atoms plus health endpoint", async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/atoms-plus/health`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    // Health endpoint returns "ok" or "healthy"
    expect(["ok", "healthy"]).toContain(data.status);
  });

  test("scaffolding templates are available", async ({ request }) => {
    const response = await request.get(
      `${BACKEND_URL}/api/v1/scaffolding/templates`
    );
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.templates).toHaveLength(4);
    const templateIds = data.templates.map((t: { id: string }) => t.id);
    expect(templateIds).toContain("react-vite-ts");
    expect(templateIds).toContain("nextjs-app-router");
  });

  test("roles list is available", async ({ request }) => {
    // The endpoint is /api/v1/roles/list (not just /api/v1/roles/)
    const response = await request.get(`${BACKEND_URL}/api/v1/roles/list`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.roles).toBeDefined();
    expect(data.count).toBeGreaterThanOrEqual(8);
  });

  test("race mode models are available", async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/v1/race/models`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.models).toBeDefined();
    expect(data.models.length).toBeGreaterThanOrEqual(10);
  });

  test("auto-detect role endpoint works", async ({ request }) => {
    const response = await request.post(`${BACKEND_URL}/api/v1/roles/auto-detect`, {
      data: { user_input: "Design a scalable microservices architecture" },
    });
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.role_id).toBeDefined();
    expect(data.role_name).toBeDefined();
    expect(data.confidence).toBeGreaterThanOrEqual(0);
    expect(data.matched_keywords).toBeDefined();
  });
});

test.describe("Frontend UI Tests", () => {
  test.skip(
    !process.env.TEST_WITH_AUTH,
    "Skipping UI tests - set TEST_WITH_AUTH=1 to run"
  );

  test("homepage loads correctly", async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await expect(page).toHaveTitle(/OpenHands/i);
  });

  test("login page is accessible", async ({ page }) => {
    await page.goto(FRONTEND_URL);
    // Check for login button or auth UI
    const loginButton = page.getByRole("button", { name: /login|sign in/i });
    await expect(loginButton).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Conversation Creation with Daytona", () => {
  test.skip(
    !process.env.TEST_WITH_AUTH,
    "Skipping auth tests - set TEST_WITH_AUTH=1"
  );

  test("create conversation triggers sandbox creation", async ({ page }) => {
    // This test requires authentication
    await page.goto(FRONTEND_URL);

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Look for new conversation button
    const newConvoButton = page.getByRole("button", {
      name: /new|create|start/i,
    });
    if (await newConvoButton.isVisible()) {
      await newConvoButton.click();

      // Wait for sandbox status indicator
      const statusIndicator = page.getByText(/waiting.*sandbox|preparing/i);
      await expect(statusIndicator).toBeVisible({ timeout: 30000 });

      // Wait for ready state (may take 15-60 seconds for Daytona)
      const readyIndicator = page.getByText(/ready|connected/i);
      await expect(readyIndicator).toBeVisible({ timeout: 120000 });
    }
  });
});

