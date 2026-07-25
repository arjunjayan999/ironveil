import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardPage } from "./DashboardPage.js";

const mockUseLiveMetrics = vi.fn();

vi.mock("../hooks/useLiveMetrics.js", () => ({
	useLiveMetrics: () => mockUseLiveMetrics(),
}));

vi.mock("../api/threats.js", () => ({
	listThreats: vi.fn(),
}));

vi.mock("@/api/organizations.js", () => ({
	getMyOrganizations: vi.fn().mockResolvedValue([
		{
			organizationId: "org-1",
			userId: "user-1",
			role: "ADMIN",
			joinedAt: new Date().toISOString(),
		},
	]),
}));

vi.mock("../auth/context.js", () => ({
	useAuth: () => ({
		currentOrganizationId: "org-1",
	}),
}));

vi.mock("sonner", () => ({
	toast: {
		error: vi.fn(),
	},
}));

import { listThreats } from "../api/threats.js";

function renderDashboard() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
			},
		},
	});

	return render(
		<QueryClientProvider client={queryClient}>
			<MemoryRouter>
				<DashboardPage />
			</MemoryRouter>
		</QueryClientProvider>,
	);
}

describe("DashboardPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		mockUseLiveMetrics.mockReturnValue({
			highCount: 0,
			mediumCount: 0,
			lowCount: 0,
			activeAlerts: 0,
			recentThreats: [],
			activityFeed: [],
		});

		vi.mocked(listThreats).mockResolvedValue({
			data: [],
			meta: {
				total: 0,
				page: 1,
				limit: 10,
				totalPages: 0,
			},
		});
	});

	it("renders metric cards", () => {
		renderDashboard();

		expect(screen.getByText("High Threats")).toBeInTheDocument();
		expect(screen.getByText("Medium Threats")).toBeInTheDocument();
		expect(screen.getByText("Low Threats")).toBeInTheDocument();
		expect(screen.getByText("Active Alerts")).toBeInTheDocument();
	});

	it("renders recent threats and live feed sections", () => {
		renderDashboard();

		expect(screen.getByText("Recent Threats")).toBeInTheDocument();
		expect(screen.getByText("Live Feed")).toBeInTheDocument();
	});

	it("shows empty state when no threats exist", async () => {
		renderDashboard();

		expect(await screen.findByText(/No threats yet/i)).toBeInTheDocument();
	});

	it("renders threats returned from the API", async () => {
		vi.mocked(listThreats).mockResolvedValue({
			data: [
				{
					id: "123456789",
					organizationId: "org-1",
					eventId: "event-1",
					threatLevel: "HIGH",
					threatScore: 95,
					status: "OPEN",
					scoreBreakdown: {
						restrictedZoneEntry: 20,
						unknownIdentity: 20,
						highSpeed: 20,
						highAltitude: 20,
						repeatedEntry: 15,
					},
					createdAt: "2025-01-01T00:00:00.000Z",
				},
			],
			meta: {
				total: 1,
				page: 1,
				limit: 10,
				totalPages: 1,
			},
		});

		renderDashboard();

		expect(await screen.findByText("95")).toBeInTheDocument();
		expect(screen.getByText("HIGH")).toBeInTheDocument();

		expect(screen.getByRole("link", { name: /12345678/i })).toHaveAttribute(
			"href",
			"/threats/123456789",
		);
	});

	it("prefers live threats over API threats", async () => {
		mockUseLiveMetrics.mockReturnValue({
			highCount: 1,
			mediumCount: 0,
			lowCount: 0,
			activeAlerts: 1,
			recentThreats: [
				{
					id: "live-threat",
					threatLevel: "HIGH",
					threatScore: 99,
					status: "OPEN",
				},
			],
			activityFeed: [],
		});

		vi.mocked(listThreats).mockResolvedValue({
			data: [
				{
					id: "live-threat",
					organizationId: "org-1",
					eventId: "event-1",
					threatLevel: "HIGH",
					threatScore: 99,
					status: "OPEN",
					scoreBreakdown: {
						restrictedZoneEntry: 20,
						unknownIdentity: 20,
						highSpeed: 20,
						highAltitude: 20,
						repeatedEntry: 19,
					},
					createdAt: "2025-01-01T00:00:00.000Z",
				},
			],
			meta: {
				total: 1,
				page: 1,
				limit: 10,
				totalPages: 1,
			},
		});

		renderDashboard();

		expect(await screen.findByText("99")).toBeInTheDocument();
		expect(screen.queryByText("10")).not.toBeInTheDocument();
	});

	it("renders activity feed entries", () => {
		mockUseLiveMetrics.mockReturnValue({
			highCount: 0,
			mediumCount: 0,
			lowCount: 0,
			activeAlerts: 0,
			recentThreats: [],
			activityFeed: [
				{
					id: "1",
					label: "Drone detected",
					timestamp: new Date().toISOString(),
				},
			],
		});

		renderDashboard();

		expect(screen.getByText("Drone detected")).toBeInTheDocument();
	});

	it("shows a toast for a HIGH live threat", () => {
		mockUseLiveMetrics.mockReturnValue({
			highCount: 1,
			mediumCount: 0,
			lowCount: 0,
			activeAlerts: 1,
			recentThreats: [
				{
					id: "abcdefgh123456",
					threatLevel: "HIGH",
					threatScore: 98,
					status: "OPEN",
				},
			],
			activityFeed: [],
		});

		renderDashboard();

		expect(toast.error).toHaveBeenCalledWith(
			"HIGH Threat Detected",
			expect.objectContaining({
				description: expect.stringContaining("Score 98"),
			}),
		);
	});
});
