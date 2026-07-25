import fjwt from "@fastify/jwt";
import type { Threat } from "@ironveil/shared-types";
import Fastify from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { findAlertByThreatId } from "../db/queries/alerts.js";
import { writeAuditLog } from "../db/queries/audit.js";
import { findMembership } from "../db/queries/organizationmembers.js";
import {
	findThreatById,
	listThreats,
	updateThreatStatus,
} from "../db/queries/threats.js";
import { publishThreatUpdatedEvent } from "../kafka/producer.js";
import { getCached, invalidateCache, setCache } from "../redis/client.js";
import { threatRoutes } from "./threats.js";

vi.mock("../db/queries/threats.js", () => ({
	listThreats: vi.fn(),
	findThreatById: vi.fn(),
	updateThreatStatus: vi.fn(),
}));

vi.mock("../db/queries/organizationmembers.js", () => ({
	findMembership: vi.fn(),
}));

vi.mock("../db/queries/alerts.js", () => ({
	findAlertByThreatId: vi.fn(),
}));

vi.mock("../db/queries/audit.js", () => ({
	writeAuditLog: vi.fn(),
}));

vi.mock("../redis/client.js", () => ({
	getCached: vi.fn(),
	setCache: vi.fn(),
	invalidateCache: vi.fn(),
}));

vi.mock("../kafka/producer.js", () => ({
	publishThreatUpdatedEvent: vi.fn(),
}));

async function buildTestApp() {
	const app = Fastify({ logger: false });

	await app.register(fjwt, {
		secret: "test-secret-at-least-32-chars-long",
	});

	await app.register(threatRoutes, {
		prefix: "/organizations/:organizationId/threats",
	});

	await app.ready();

	const makeToken = () =>
		app.jwt.sign({
			sub: "user-123",
			username: "tester",
		});

	return { app, makeToken };
}

const mockThreat: Threat = {
	id: "threat-1",
	organizationId: "org-1",
	eventId: "event-1",
	threatScore: 90,
	threatLevel: "HIGH",
	status: "OPEN",
	scoreBreakdown: {
		restrictedZoneEntry: 30,
		unknownIdentity: 20,
		highSpeed: 20,
		highAltitude: 20,
		repeatedEntry: 0,
	},
	createdAt: new Date().toISOString(),
};

describe("GET /organizations/:organizationId/threats", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns paginated threats", async () => {
		const { app, makeToken } = await buildTestApp();

		vi.mocked(listThreats).mockResolvedValue({
			data: [mockThreat],
			total: 1,
		});
		vi.mocked(findMembership).mockResolvedValue({
			organizationId: "org-1",
			userId: "user-123",
			role: "ANALYST",
			joinedAt: new Date(),
		});

		const response = await app.inject({
			method: "GET",
			url: "/organizations/org-1/threats",
			headers: {
				authorization: `Bearer ${makeToken()}`,
			},
		});

		expect(response.statusCode).toBe(200);

		expect(listThreats).toHaveBeenCalledWith(
			"org-1",
			expect.objectContaining({
				page: 1,
				limit: 20,
			}),
		);
	});

	it("passes filters", async () => {
		const { app, makeToken } = await buildTestApp();

		vi.mocked(listThreats).mockResolvedValue({
			data: [],
			total: 0,
		});
		vi.mocked(findMembership).mockResolvedValue({
			organizationId: "org-1",
			userId: "user-123",
			role: "ANALYST",
			joinedAt: new Date(),
		});

		await app.inject({
			method: "GET",
			url: "/organizations/org-1/threats?level=HIGH&status=OPEN",
			headers: {
				authorization: `Bearer ${makeToken()}`,
			},
		});

		expect(listThreats).toHaveBeenCalledWith(
			"org-1",
			expect.objectContaining({
				level: "HIGH",
				status: "OPEN",
			}),
		);
	});
});

describe("GET /organizations/:organizationId/threats/:id", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns cached threat", async () => {
		const { app, makeToken } = await buildTestApp();

		vi.mocked(getCached).mockResolvedValue(mockThreat);
		vi.mocked(findMembership).mockResolvedValue({
			organizationId: "org-1",
			userId: "user-123",
			role: "ANALYST",
			joinedAt: new Date(),
		});

		const response = await app.inject({
			method: "GET",
			url: "/organizations/org-1/threats/threat-1",
			headers: {
				authorization: `Bearer ${makeToken()}`,
			},
		});

		expect(response.statusCode).toBe(200);
		expect(findThreatById).not.toHaveBeenCalled();
	});

	it("returns 404 when missing", async () => {
		const { app, makeToken } = await buildTestApp();

		vi.mocked(getCached).mockResolvedValue(null);
		vi.mocked(findThreatById).mockResolvedValue(null);
		vi.mocked(findMembership).mockResolvedValue({
			organizationId: "org-1",
			userId: "user-123",
			role: "ANALYST",
			joinedAt: new Date(),
		});
		const response = await app.inject({
			method: "GET",
			url: "/organizations/org-1/threats/missing",
			headers: {
				authorization: `Bearer ${makeToken()}`,
			},
		});

		expect(response.statusCode).toBe(404);
	});

	it("fetches threat, alert and caches result", async () => {
		const { app, makeToken } = await buildTestApp();

		vi.mocked(getCached).mockResolvedValue(null);
		vi.mocked(findThreatById).mockResolvedValue(mockThreat);
		vi.mocked(findAlertByThreatId).mockResolvedValue(null);
		vi.mocked(findMembership).mockResolvedValue({
			organizationId: "org-1",
			userId: "user-123",
			role: "ANALYST",
			joinedAt: new Date(),
		});

		const response = await app.inject({
			method: "GET",
			url: "/organizations/org-1/threats/threat-1",
			headers: {
				authorization: `Bearer ${makeToken()}`,
			},
		});

		expect(response.statusCode).toBe(200);

		expect(setCache).toHaveBeenCalledWith(
			"cache:org-1:threat:threat-1",
			expect.objectContaining({
				id: "threat-1",
				alert: null,
			}),
		);
	});
});

describe("POST /:id/escalate", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns 403 for analyst", async () => {
		const { app, makeToken } = await buildTestApp();
		vi.mocked(findMembership).mockResolvedValue({
			organizationId: "org-1",
			userId: "user-123",
			role: "ANALYST",
			joinedAt: new Date(),
		});

		const response = await app.inject({
			method: "POST",
			url: "/organizations/org-1/threats/threat-1/escalate",
			headers: {
				authorization: `Bearer ${makeToken()}`,
			},
		});

		expect(response.statusCode).toBe(403);
	});

	it("returns 404 when threat is missing", async () => {
		const { app, makeToken } = await buildTestApp();

		vi.mocked(findThreatById).mockResolvedValue(null);
		vi.mocked(findMembership).mockResolvedValue({
			organizationId: "org-1",
			userId: "user-123",
			role: "COMMANDER",
			joinedAt: new Date(),
		});

		const response = await app.inject({
			method: "POST",
			url: "/organizations/org-1/threats/threat-1/escalate",
			headers: {
				authorization: `Bearer ${makeToken()}`,
			},
		});

		expect(response.statusCode).toBe(404);
	});

	it("returns 404 when resolving a missing threat", async () => {
		const { app, makeToken } = await buildTestApp();

		vi.mocked(findThreatById).mockResolvedValue(null);
		vi.mocked(findMembership).mockResolvedValue({
			organizationId: "org-1",
			userId: "user-123",
			role: "ADMIN",
			joinedAt: new Date(),
		});

		const response = await app.inject({
			method: "POST",
			url: "/organizations/org-1/threats/threat-1/resolve",
			headers: {
				authorization: `Bearer ${makeToken()}`,
			},
		});

		expect(response.statusCode).toBe(404);
	});

	it("returns 400 if already escalated", async () => {
		const { app, makeToken } = await buildTestApp();

		vi.mocked(findThreatById).mockResolvedValue({
			...mockThreat,
			status: "ESCALATED",
		});
		vi.mocked(findMembership).mockResolvedValue({
			organizationId: "org-1",
			userId: "user-123",
			role: "COMMANDER",
			joinedAt: new Date(),
		});

		const response = await app.inject({
			method: "POST",
			url: "/organizations/org-1/threats/threat-1/escalate",
			headers: {
				authorization: `Bearer ${makeToken()}`,
			},
		});

		expect(response.statusCode).toBe(400);
	});

	it("returns 400 when escalating a resolved threat", async () => {
		const { app, makeToken } = await buildTestApp();

		vi.mocked(findThreatById).mockResolvedValue({
			...mockThreat,
			status: "RESOLVED",
		});

		vi.mocked(findMembership).mockResolvedValue({
			organizationId: "org-1",
			userId: "user-123",
			role: "ADMIN",
			joinedAt: new Date(),
		});

		const response = await app.inject({
			method: "POST",
			url: "/organizations/org-1/threats/threat-1/escalate",
			headers: {
				authorization: `Bearer ${makeToken()}`,
			},
		});

		expect(response.statusCode).toBe(400);
		expect(response.json()).toEqual({
			error: "Bad Request",
			message: "Cannot escalate a resolved threat",
		});
	});

	it("escalates threat", async () => {
		const { app, makeToken } = await buildTestApp();

		const updated: Threat = {
			...mockThreat,
			status: "ESCALATED",
		};

		vi.mocked(findThreatById).mockResolvedValue(mockThreat);
		vi.mocked(updateThreatStatus).mockResolvedValue(updated);
		vi.mocked(findMembership).mockResolvedValue({
			organizationId: "org-1",
			userId: "user-123",
			role: "ADMIN",
			joinedAt: new Date(),
		});

		const response = await app.inject({
			method: "POST",
			url: "/organizations/org-1/threats/threat-1/escalate",
			headers: {
				authorization: `Bearer ${makeToken()}`,
			},
		});

		expect(response.statusCode).toBe(200);

		expect(updateThreatStatus).toHaveBeenCalledWith(
			"org-1",
			"threat-1",
			"ESCALATED",
		);

		expect(invalidateCache).toHaveBeenCalledWith("cache:org-1:threat:threat-1");

		expect(publishThreatUpdatedEvent).toHaveBeenCalledWith(
			"org-1",
			"threat-1",
			"OPEN",
			"ESCALATED",
		);

		expect(writeAuditLog).toHaveBeenCalledWith(
			"user-123",
			"org-1",
			"THREAT_ESCALATED",
			"threat",
			"threat-1",
			{
				previousStatus: "OPEN",
			},
		);
	});
});

describe("POST /:id/resolve", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns 404 when resolving a missing threat", async () => {
		const { app, makeToken } = await buildTestApp();

		vi.mocked(findThreatById).mockResolvedValue(null);
		vi.mocked(findMembership).mockResolvedValue({
			organizationId: "org-1",
			userId: "user-123",
			role: "ADMIN",
			joinedAt: new Date(),
		});

		const response = await app.inject({
			method: "POST",
			url: "/organizations/org-1/threats/threat-1/resolve",
			headers: {
				authorization: `Bearer ${makeToken()}`,
			},
		});

		expect(response.statusCode).toBe(404);
	});

	it("returns 400 if already resolved", async () => {
		const { app, makeToken } = await buildTestApp();

		vi.mocked(findThreatById).mockResolvedValue({
			...mockThreat,
			status: "RESOLVED",
		});
		vi.mocked(findMembership).mockResolvedValue({
			organizationId: "org-1",
			userId: "user-123",
			role: "ADMIN",
			joinedAt: new Date(),
		});

		const response = await app.inject({
			method: "POST",
			url: "/organizations/org-1/threats/threat-1/resolve",
			headers: {
				authorization: `Bearer ${makeToken()}`,
			},
		});

		expect(response.statusCode).toBe(400);
	});

	it("resolves a threat", async () => {
		const { app, makeToken } = await buildTestApp();

		vi.mocked(findThreatById).mockResolvedValue(mockThreat);
		vi.mocked(updateThreatStatus).mockResolvedValue({
			...mockThreat,
			status: "RESOLVED",
		});
		vi.mocked(findMembership).mockResolvedValue({
			organizationId: "org-1",
			userId: "user-123",
			role: "COMMANDER",
			joinedAt: new Date(),
		});

		const response = await app.inject({
			method: "POST",
			url: "/organizations/org-1/threats/threat-1/resolve",
			headers: {
				authorization: `Bearer ${makeToken()}`,
			},
		});

		expect(response.statusCode).toBe(200);

		expect(updateThreatStatus).toHaveBeenCalledWith(
			"org-1",
			"threat-1",
			"RESOLVED",
		);

		expect(invalidateCache).toHaveBeenCalledWith("cache:org-1:threat:threat-1");

		expect(publishThreatUpdatedEvent).toHaveBeenCalledWith(
			"org-1",
			"threat-1",
			"OPEN",
			"RESOLVED",
		);
	});
});
