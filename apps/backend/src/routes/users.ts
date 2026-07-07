import argon2 from "argon2";
import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { writeAuditLog } from "../db/queries/audit.js";
import {
	acceptInvitation,
	findInvitationByToken,
} from "../db/queries/invitations.js";
import { addMember } from "../db/queries/organizationmembers.js";
import {
	createUser,
	deleteUser,
	findUserById,
	listUsers,
} from "../db/queries/users.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";

const createUserSchema = z.object({
	username: z.string().min(3).max(64),
	email: z.email(),
	password: z.string().min(12, "Password must be at least 12 characters long"),
});

const paginationSchema = z.object({
	page: z.coerce.number().min(1).default(1),
	limit: z.coerce.number().min(1).max(100).default(20),
});

const acceptInvitationSchema = z.object({
	token: z.string().min(1),
});

export const userRoutes: FastifyPluginAsync = async (fastify) => {
	fastify.get(
		"/",
		{ preHandler: [authenticate, requireRole("ADMIN")] },
		async (request, reply) => {
			const { page, limit } = paginationSchema.parse(request.query);
			const { data, total } = await listUsers(page, limit);
			return reply.send({
				data,
				meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
			});
		},
	);

	fastify.post("/", async (request, reply) => {
		const result = createUserSchema.safeParse(request.body);
		if (!result.success) {
			return reply.status(400).send({
				error: "Bad Request",
				message: result.error.message,
			});
		}
		const { username, email, password } = result.data;
		const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
		const user = await createUser(username, email, passwordHash);
		await writeAuditLog(user.id, null, "USER_CREATED", "user", user.id, {
			username,
		});
		return reply.status(201).send({ data: user });
	});

	fastify.delete(
		"/:id",
		{ preHandler: [authenticate] },
		async (request, reply) => {
			const { id } = request.params as { id: string };
			const user = await findUserById(id);
			if (!user) {
				return reply
					.status(404)
					.send({ error: "Not Found", message: "User not found" });
			}
			await deleteUser(id);
			await writeAuditLog(request.user.sub, null, "USER_DELETED", "user", id, {
				username: user.username,
			});
			return reply.status(204).send();
		},
	);

	fastify.post(
		"/me/invitations/accept",
		{ preHandler: [authenticate] },
		async (request, reply) => {
			const result = acceptInvitationSchema.safeParse(request.body);
			if (!result.success) {
				return reply.status(400).send({
					error: "Bad Request",
					message: result.error.message,
				});
			}
			const invitation = await findInvitationByToken(result.data.token);
			if (!invitation) {
				return reply.status(404).send({
					error: "Not Found",
					message: "Invitation not found",
				});
			}
			if (invitation.accepted) {
				return reply.status(409).send({
					error: "Conflict",
					message: "Invitation has already been accepted",
				});
			}
			if (new Date(invitation.expiresAt) < new Date()) {
				return reply.status(410).send({
					error: "Gone",
					message: "Invitation has expired",
				});
			}

			await addMember(
				invitation.organizationId,
				request.user.sub,
				invitation.role,
			);

			await acceptInvitation(invitation.id);

			await writeAuditLog(
				request.user.sub,
				invitation.organizationId,
				"INVITATION_ACCEPTED",
				"invitation",
				invitation.id,
				{
					organizationId: invitation.organizationId,
				},
			);
			return reply.send({ message: "Invitation accepted successfully" });
		},
	);
};
