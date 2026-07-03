import type { Role } from "@ironveil/shared-types";
import type { FastifyReply, FastifyRequest } from "fastify";

export function requireRole(...allowed: Role[]) {
	return async function rbacMiddleware(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		if (!allowed.includes(request.user.role)) {
			await reply.status(403).send({
				error: "Forbidden",
				message: `This action requires one of: ${allowed.join(", ")}`,
			});
		}
	};
}
