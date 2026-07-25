import { expect, test } from "@playwright/test";
import { login, waitForThreat } from "./helpers.js";

test.describe("Threat Center", () => {
	test.beforeEach(async ({ page }) => {
		await login(page);
		await page.getByRole("link", { name: /threat center/i }).click();

		await expect(page).toHaveURL(/\/threats$/);
	});

	test("renders the threat center heading", async ({ page }) => {
		await expect(
			page.getByRole("heading", { name: /threat center/i }),
		).toBeVisible();
	});

	test("shows the level filter dropdown", async ({ page }) => {
		await expect(page.getByRole("combobox").first()).toBeVisible();
	});

	test("threats table populates from the API", async ({ page }) => {
		await waitForThreat(page);
		const rows = page.locator("table tbody tr");
		await expect(rows.first()).toBeVisible();
	});

	test("filtering by HIGH level shows only HIGH threats", async ({ page }) => {
		await waitForThreat(page);
		await page.selectOption("select:first-of-type", "HIGH");
		await page.waitForTimeout(500);
		const mediumBadges = page.locator('table tbody tr span:has-text("MEDIUM")');
		await expect(mediumBadges).toHaveCount(0);
	});

	test("navigating to a threat detail page shows the score breakdown", async ({
		page,
	}) => {
		await waitForThreat(page);
		await page.locator('table a[href^="/threats/"]').first().click();

		await expect(page.getByText("Score Breakdown")).toBeVisible();
		await expect(page.getByText("/100")).toBeVisible();
	});

	test("detail page shows intelligence summary section", async ({ page }) => {
		await waitForThreat(page);
		await page.locator('table a[href^="/threats/"]').first().click();

		await expect(
			page.locator('[data-slot="card-title"]', {
				hasText: "Intelligence Summary",
			}),
		).toBeVisible();
	});
});
