import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockLogin = vi.fn();
const mockNavigate = vi.fn();

vi.mock("../auth/context.js", () => ({
	useAuth: () => ({ login: mockLogin, isAuthenticated: false, user: null }),
}));

vi.mock("react-router", async (importOriginal) => {
	const actual = await importOriginal<typeof import("react-router")>();
	return { ...actual, useNavigate: () => mockNavigate };
});

import { LoginPage } from "./LoginPage.js";

function renderLoginPage() {
	return render(
		<MemoryRouter>
			<LoginPage />
		</MemoryRouter>,
	);
}

describe("LoginPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockLogin.mockResolvedValue(undefined);
	});

	it("renders the username and password fields", () => {
		renderLoginPage();
		expect(screen.getByLabelText("Username")).toBeInTheDocument();
		expect(screen.getByLabelText("Password")).toBeInTheDocument();
	});

	it("renders the sign-in button", () => {
		renderLoginPage();
		expect(
			screen.getByRole("button", { name: /sign in/i }),
		).toBeInTheDocument();
	});

	it("calls login with the entered credentials on submit", async () => {
		renderLoginPage();

		await userEvent.type(screen.getByLabelText("Username"), "admin");
		await userEvent.type(screen.getByLabelText("Password"), "Admin1234!");
		await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

		await waitFor(() => {
			expect(mockLogin).toHaveBeenCalledWith("admin", "Admin1234!");
		});
	});

	it("navigates to / on successful login", async () => {
		renderLoginPage();

		await userEvent.type(screen.getByLabelText("Username"), "admin");
		await userEvent.type(screen.getByLabelText("Password"), "Admin1234!");
		await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

		await waitFor(() => {
			expect(mockNavigate).toHaveBeenCalledWith("/");
		});
	});

	it("shows an error message when login fails", async () => {
		mockLogin.mockRejectedValue(new Error("Invalid credentials"));
		renderLoginPage();

		await userEvent.type(screen.getByLabelText("Username"), "admin");
		await userEvent.type(screen.getByLabelText("Password"), "wrongpassword");
		await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

		await waitFor(() => {
			expect(screen.getByTestId("login-error")).toHaveTextContent(
				"Invalid credentials",
			);
		});
	});

	it("does NOT navigate on failed login", async () => {
		mockLogin.mockRejectedValue(new Error("Invalid credentials"));
		renderLoginPage();

		await userEvent.type(screen.getByLabelText("Username"), "bad");
		await userEvent.type(screen.getByLabelText("Password"), "bad");
		await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

		await waitFor(() => {
			expect(screen.getByTestId("login-error")).toBeInTheDocument();
		});

		expect(mockNavigate).not.toHaveBeenCalled();
	});

	it('shows "Signing in…" on the button while loading', async () => {
		mockLogin.mockImplementation(() => new Promise(() => {}));
		renderLoginPage();

		await userEvent.type(screen.getByLabelText("Username"), "admin");
		await userEvent.type(screen.getByLabelText("Password"), "Admin1234!");
		await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

		expect(
			await screen.findByRole("button", { name: /signing in/i }),
		).toBeDisabled();
	});
	it("shows a generic error when login rejects with a non-Error value", async () => {
		mockLogin.mockRejectedValue("oops");

		renderLoginPage();

		await userEvent.type(screen.getByLabelText("Username"), "admin");
		await userEvent.type(screen.getByLabelText("Password"), "Admin1234!");
		await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

		await waitFor(() => {
			expect(screen.getByTestId("login-error")).toHaveTextContent(
				"Login failed",
			);
		});

		expect(mockNavigate).not.toHaveBeenCalled();
	});
});
