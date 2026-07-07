import type { OrganizationRole } from "@ironveil/shared-types";
import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { writeAuditLog } from "../db/queries/audit.js";
import {
	createInvitation,
	deleteInvitation,
	findInvitationById,
	listInvitations,
} from "../db/queries/invitations.js";

import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";

const inviteSchema = z.object({
	email: z.email(),
	role: z.enum(["ADMIN", "COMMANDER", "ANALYST"] satisfies [
		OrganizationRole,
		...OrganizationRole[],
	]),
});

export const organizationInvitationRoutes: FastifyPluginAsync = async (
	fastify,
) => {
	fastify.get(
		"/",
		{ preHandler: [authenticate, requireRole("ADMIN")] },
		async (request, reply) => {
			const { organizationId } = request.params as { organizationId: string };
			const invitations = await listInvitations(organizationId);
			return reply.send({ data: invitations });
		},
	);

	fastify.post(
		"/",
		{ preHandler: [authenticate, requireRole("ADMIN")] },
		async (request, reply) => {
			const { organizationId } = request.params as { organizationId: string };
			const result = inviteSchema.safeParse(request.body);
			if (!result.success) {
				return reply.status(400).send({
					error: "Bad Request",
					message: result.error.message,
				});
			}
			const { email, role } = result.data;
			const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

			const invitation = await createInvitation(
				organizationId,
				email,
				role,
				request.user.sub,
				expiresAt,
			);
			await writeAuditLog(
				request.user.sub,
				organizationId,
				"INVITATION_CREATED",
				"invitation",
				invitation.id,
				{
					organizationId,
					email,
					role,
				},
			);
			return reply.status(201).send({ data: invitation });
		},
	);

	fastify.delete(
		"/:id",
		{ preHandler: [authenticate, requireRole("ADMIN")] },
		async (request, reply) => {
			const { id } = request.params as {
				organizationId: string;
				id: string;
			};
			const invitation = await findInvitationById(id);
			if (!invitation) {
				return reply.status(404).send({
					error: "Not Found",
					message: "Invitation not found",
				});
			}
			await deleteInvitation(id);
			await writeAuditLog(
				request.user.sub,
				invitation.organizationId,
				"INVITATION_DELETED",
				"invitation",
				id,
				{
					email: invitation.email,
					organizationId: invitation.organizationId,
				},
			);
			return reply.status(204).send();
		},
	);
};
