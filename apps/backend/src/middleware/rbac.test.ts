import type { OrganizationMember, Role } from "@ironveil/shared-types";
import type { FastifyReply, FastifyRequest } from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { findMembership } from "../db/queries/organizationmembers.js";
import { requireRole } from "./rbac.js";

vi.mock("../db/queries/organizationmembers.js", () => ({
	findMembership: vi.fn(),
}));

function makeMembership(role: Role): OrganizationMember {
	return {
		organizationId: "org-123",
		userId: "user-id-123",
		role,
		joinedAt: new Date(),
	};
}

const mockedFindMembership = vi.mocked(findMembership);

function makeRequest(): FastifyRequest {
	return {
		user: {
			sub: "user-id-123",
			username: "testuser",
			iat: 0,
			exp: 9999999999,
		},
		params: {
			organizationId: "org-123",
		},
	} as unknown as FastifyRequest;
}

function makeReply(): FastifyReply {
	return {
		status: vi.fn().mockReturnThis(),
		send: vi.fn().mockReturnThis(),
	} as unknown as FastifyReply;
}

describe("requireRole middleware", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("does nothing when the user has an allowed role", async () => {
		mockedFindMembership.mockResolvedValue(makeMembership("ADMIN"));

		const handler = requireRole("ADMIN");
		const reply = makeReply();

		await handler(makeRequest(), reply);

		expect(reply.status).not.toHaveBeenCalled();
		expect(reply.send).not.toHaveBeenCalled();
	});

	it("returns 403 when the user role is not in the allowed list", async () => {
		mockedFindMembership.mockResolvedValue(makeMembership("ANALYST"));

		const handler = requireRole("ADMIN", "COMMANDER");
		const reply = makeReply();

		await handler(makeRequest(), reply);

		expect(reply.status).toHaveBeenCalledWith(403);
		expect(reply.send).toHaveBeenCalledWith(
			expect.objectContaining({ error: "Forbidden" }),
		);
	});

	it("allows COMMANDER when COMMANDER is listed", async () => {
		mockedFindMembership.mockResolvedValue(makeMembership("COMMANDER"));

		const handler = requireRole("ADMIN", "COMMANDER");
		const reply = makeReply();

		await handler(makeRequest(), reply);

		expect(reply.status).not.toHaveBeenCalled();
		expect(reply.send).not.toHaveBeenCalled();
	});

	it("blocks COMMANDER when only ADMIN is listed", async () => {
		mockedFindMembership.mockResolvedValue(makeMembership("COMMANDER"));

		const handler = requireRole("ADMIN");
		const reply = makeReply();

		await handler(makeRequest(), reply);

		expect(reply.status).toHaveBeenCalledWith(403);
	});

	it("blocks ANALYST from ADMIN-only routes", async () => {
		mockedFindMembership.mockResolvedValue(makeMembership("ANALYST"));

		const handler = requireRole("ADMIN");
		const reply = makeReply();

		await handler(makeRequest(), reply);

		expect(reply.status).toHaveBeenCalledWith(403);
	});

	it("returns 403 when the user is not a member of the organization", async () => {
		mockedFindMembership.mockResolvedValue(null);

		const handler = requireRole("ADMIN");
		const reply = makeReply();

		await handler(makeRequest(), reply);

		expect(reply.status).toHaveBeenCalledWith(403);
		expect(reply.send).toHaveBeenCalledWith({
			error: "Forbidden",
			message: "You are not a member of this organization",
		});
	});

	it("error message lists the allowed roles", async () => {
		mockedFindMembership.mockResolvedValue(makeMembership("ANALYST"));

		const handler = requireRole("ADMIN", "COMMANDER");
		const reply = makeReply();

		await handler(makeRequest(), reply);

		expect(reply.send).toHaveBeenCalledWith(
			expect.objectContaining({
				message: expect.stringContaining("ADMIN"),
			}),
		);
		expect(reply.send).toHaveBeenCalledWith(
			expect.objectContaining({
				message: expect.stringContaining("COMMANDER"),
			}),
		);
	});
});
