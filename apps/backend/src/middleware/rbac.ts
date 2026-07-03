import type { OrganizationParams, Role } from "@ironveil/shared-types";
import type { FastifyReply, FastifyRequest } from "fastify";
import { findMembership } from "../db/queries/organizationmembers.js";

export function requireRole(...allowed: Role[]) {
	return async function rbacMiddleware(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		const { organizationId } = request.params as OrganizationParams;
		const membership = await findMembership(
			organizationId,
			request.user.sub,
		);
		if (!membership) {
			return reply.status(403).send({
				error: "Forbidden",
				message: "You are not a member of this organization",
			});
		}
		if (!allowed.includes(membership.role)) {
			await reply.status(403).send({
				error: "Forbidden",
				message: `This action requires one of: ${allowed.join(", ")}`,
			});
		}
	};
}
