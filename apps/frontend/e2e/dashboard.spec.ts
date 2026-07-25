import { expect, test } from "@playwright/test";
import { login, waitForThreat } from "./helpers.js";

test.describe("Dashboard", () => {
	test.beforeEach(async ({ page }) => {
		await login(page);
		await page.getByRole("button", { name: "Open" }).click();
		await expect(page).toHaveURL("/");
	});

	test("shows all four metric cards", async ({ page }) => {
		await expect(page.getByText("High Threats")).toBeVisible();
		await expect(page.getByText("Medium Threats")).toBeVisible();
		await expect(page.getByText("Low Threats")).toBeVisible();
		await expect(page.getByText("Active Alerts")).toBeVisible();
	});

	test("metric counters are numbers (not NaN or undefined)", async ({
		page,
	}) => {
		await expect(page.locator(".tabular-nums").first()).toBeVisible();

		const cards = page.locator(".tabular-nums");
		const count = await cards.count();
		expect(count).toBeGreaterThanOrEqual(4);

		for (let i = 0; i < count; i++) {
			const text = await cards.nth(i).innerText();
			expect(Number.isNaN(parseInt(text, 10))).toBe(false);
		}
	});

	test("live feed section is present", async ({ page }) => {
		await expect(page.getByText("Live Feed")).toBeVisible();
	});

	test("recent threats table appears and populates", async ({ page }) => {
		await expect(page.getByText("Recent Threats")).toBeVisible();
		await waitForThreat(page);
		const link = page.locator('table a[href^="/threats/"]').first();
		await expect(link).toBeVisible();
	});

	test("clicking a threat ID navigates to the detail page", async ({
		page,
	}) => {
		await waitForThreat(page);

		const firstLink = page.locator('table a[href^="/threats/"]').first();

		const href = await firstLink.getAttribute("href");
		if (!href) {
			throw new Error("Threat link is missing href");
		}

		await firstLink.click();
		await expect(page).toHaveURL(href);
	});
});
