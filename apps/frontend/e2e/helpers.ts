import type { Page } from "@playwright/test";

export const CREDENTIALS = {
	admin: { username: "admin", password: "Admin1234!" },
	commander: {
		username: "commander",
		password: "Admin1234!",
	},
	analyst: { username: "analyst", password: "Admin1234!" },
} as const;

export async function login(
	page: Page,
	credentials = CREDENTIALS.admin,
): Promise<void> {
	await page.goto("/login");
	await page.fill('[name="username"]', credentials.username);
	await page.fill('[name="password"]', credentials.password);
	await page.click('button[type="submit"]');
	await page.waitForURL("/", { timeout: 10_000 });
}

export async function waitForThreat(page: Page): Promise<void> {
	await page.waitForSelector("table tbody tr:not(:empty)", { timeout: 30_000 });
}
