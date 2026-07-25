import { expect, test } from "@playwright/test";
import { login } from "./helpers.js";

test.describe("Authentication", () => {
	test("login page renders username and password fields", async ({ page }) => {
		await page.goto("/login");
		await expect(page.getByLabel("Username")).toBeVisible();
		await expect(page.getByLabel("Password")).toBeVisible();
		await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
	});

	test("invalid credentials shows error message", async ({ page }) => {
		await page.goto("/login");
		await page.fill('[name="username"]', "admin");
		await page.fill('[name="password"]', "wrongpassword");
		await page.click('button[type="submit"]');

		await expect(page.getByTestId("login-error")).toBeVisible();
		await expect(page.getByTestId("login-error")).toContainText(
			"Invalid credentials",
		);
		await expect(page).toHaveURL("/login");
	});

	test("valid credentials redirect to dashboard", async ({ page }) => {
		await login(page);
		await page.getByRole("button", { name: "Open" }).click();
		await expect(page).toHaveURL("/");
		await expect(page.getByText("Operations Dashboard")).toBeVisible();
	});

	test("unauthenticated access to / redirects to login", async ({ page }) => {
		await page.goto("/");
		await expect(page).toHaveURL("/login");
	});

	test("unauthenticated access to /threats redirects to login", async ({
		page,
	}) => {
		await page.goto("/threats");
		await expect(page).toHaveURL("/login");
	});

	test("sign out clears the session and redirects to login", async ({
		page,
	}) => {
		await login(page);
		await page.click('button:has-text("Sign out")');
		await expect(page).toHaveURL("/login");
		await page.goto("/");
		await expect(page).toHaveURL("/login");
	});
});
