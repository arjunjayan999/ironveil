import type { FastifyReply, FastifyRequest } from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authenticate } from "./auth.js";

function makeRequest(overrides?: Partial<FastifyRequest>): FastifyRequest {
	return {
		jwtVerify: vi.fn().mockResolvedValue(undefined),
		...overrides,
	} as unknown as FastifyRequest;
}

function makeReply(): FastifyReply {
	const reply = {
		status: vi.fn().mockReturnThis(),
		send: vi.fn().mockReturnThis(),
	} as unknown as FastifyReply;
	return reply;
}

describe("authenticate middleware", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("calls jwtVerify and does NOT send a reply on valid token", async () => {
		const request = makeRequest();
		const reply = makeReply();

		await authenticate(request, reply);

		expect(request.jwtVerify).toHaveBeenCalledOnce();
		expect(reply.status).not.toHaveBeenCalled();
		expect(reply.send).not.toHaveBeenCalled();
	});

	it("returns 401 when jwtVerify throws (invalid token)", async () => {
		const request = makeRequest({
			jwtVerify: vi.fn().mockRejectedValue(new Error("invalid signature")),
		});
		const reply = makeReply();

		await authenticate(request, reply);

		expect(reply.status).toHaveBeenCalledWith(401);
		expect(reply.send).toHaveBeenCalledWith(
			expect.objectContaining({ error: "Unauthorized" }),
		);
	});

	it("returns 401 when jwtVerify throws (expired token)", async () => {
		const request = makeRequest({
			jwtVerify: vi.fn().mockRejectedValue(new Error("jwt expired")),
		});
		const reply = makeReply();

		await authenticate(request, reply);

		expect(reply.status).toHaveBeenCalledWith(401);
	});
});
