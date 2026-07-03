import type { JWTPayload } from "@ironveil/shared-types";
import type { FastifyReply, FastifyRequest } from "fastify";

declare module "fastify" {
	interface FastifyRequest {
		user: JWTPayload;
	}
}

export async function authenticate(
	request: FastifyRequest,
	reply: FastifyReply,
): Promise<void> {
	try {
		await request.jwtVerify();
	} catch {
		await reply
			.status(401)
			.send({ error: "Unauthorized", message: "Invalid or expired token" });
	}
}
