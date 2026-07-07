import type { OrganizationRole } from "@ironveil/shared-types";
import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { writeAuditLog } from "../db/queries/audit.js";
import {
	addMember,
	findMembership,
	listMembers,
	removeMember,
	updateMemberRole,
} from "../db/queries/organizationmembers.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";

const addMemberSchema = z.object({
	userId: z.uuid(),
	role: z.enum(["ADMIN", "COMMANDER", "ANALYST"] satisfies [
		OrganizationRole,
		...OrganizationRole[],
	]),
});

const updateRoleSchema = z.object({
	role: z.enum(["ADMIN", "COMMANDER", "ANALYST"] satisfies [
		OrganizationRole,
		...OrganizationRole[],
	]),
});

export const organizationMemberRoutes: FastifyPluginAsync = async (fastify) => {
	fastify.get("/", { preHandler: [authenticate] }, async (request, reply) => {
		const { organizationId } = request.params as { organizationId: string };
		const members = await listMembers(organizationId);
		return reply.send({ data: members });
	});

	fastify.post(
		"/",
		{ preHandler: [authenticate, requireRole("ADMIN")] },
		async (request, reply) => {
			const { organizationId } = request.params as { organizationId: string };
			const result = addMemberSchema.safeParse(request.body);
			if (!result.success) {
				return reply.status(400).send({
					error: "Bad Request",
					message: result.error.message,
				});
			}
			const { userId, role } = result.data;
			const existingMembership = await findMembership(organizationId, userId);
			if (existingMembership) {
				return reply.status(400).send({
					error: "Conflict",
					message: "User is already a member of this organization",
				});
			}
			const member = await addMember(organizationId, userId, role);
			await writeAuditLog(
				request.user.sub,
				organizationId,
				"ORGANIZATION_MEMBER_ADDED",
				"organization-members",
				organizationId,
				{
					organizationId,
					role,
				},
			);
			return reply.status(201).send({ data: member });
		},
	);

	fastify.patch(
		"/:id",
		{ preHandler: [authenticate, requireRole("ADMIN")] },
		async (request, reply) => {
			const { organizationId, id } = request.params as {
				organizationId: string;
				id: string;
			};
			const result = updateRoleSchema.safeParse(request.body);
			if (!result.success) {
				return reply.status(400).send({
					error: "Bad Request",
					message: result.error.message,
				});
			}
			const member = await updateMemberRole(
				organizationId,
				id,
				result.data.role,
			);
			if (!member) {
				return reply.status(404).send({
					error: "Not Found",
					message: "Membership not found",
				});
			}
			await writeAuditLog(
				request.user.sub,
				organizationId,
				"ORGANIZATION_MEMBER_ROLE_UPDATED",
				"organization-members",
				organizationId,
				{
					organizationId,
					role: result.data.role,
				},
			);
			return reply.send({ data: member });
		},
	);

	fastify.delete(
		"/:id",
		{ preHandler: [authenticate, requireRole("ADMIN")] },
		async (request, reply) => {
			const { organizationId, id } = request.params as {
				organizationId: string;
				id: string;
			};
			const membership = await findMembership(organizationId, id);
			if (!membership) {
				return reply.status(404).send({
					error: "Not Found",
					message: "Membership not found",
				});
			}
			await removeMember(organizationId, id);
			await writeAuditLog(
				request.user.sub,
				organizationId,
				"ORGANIZATION_MEMBER_REMOVED",
				"organization-members",
				organizationId,
				{
					organizationId,
					role: membership.role,
				},
			);
			return reply.status(204).send();
		},
	);
};
