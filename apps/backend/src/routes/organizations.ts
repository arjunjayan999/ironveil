import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { writeAuditLog } from "../db/queries/audit.js";
import {
	addMember,
	listUserOrganizations,
} from "../db/queries/organizationmembers.js";
import {
	createOrganization,
	deleteOrganization,
	findOrganizationById,
	listOrganizations,
} from "../db/queries/organizations.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";

const createOrganizationSchema = z.object({
	name: z.string().min(1).max(255),
	slug: z
		.string()
		.min(3)
		.max(100)
		.regex(
			/^[a-z0-9-]+$/,
			"Slug must contain only lowercase letters, numbers and hyphens",
		),
});

const paginationSchema = z.object({
	page: z.coerce.number().min(1).default(1),
	limit: z.coerce.number().min(1).max(100).default(20),
});

export const organizationRoutes: FastifyPluginAsync = async (fastify) => {
	fastify.get("/", { preHandler: [authenticate] }, async (request, reply) => {
		const { page, limit } = paginationSchema.parse(request.query);
		const { data, total } = await listOrganizations(page, limit);
		return reply.send({
			data,
			meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
		});
	});

	fastify.post("/", { preHandler: [authenticate] }, async (request, reply) => {
		const result = createOrganizationSchema.safeParse(request.body);
		if (!result.success) {
			return reply.status(400).send({
				error: "Bad Request",
				message: result.error.message,
			});
		}
		const { name, slug } = result.data;
		const organization = await createOrganization(name, slug, request.user.sub);
		await addMember(organization.id, request.user.sub, "ADMIN");
		await writeAuditLog(
			request.user.sub,
			organization.id,
			"ORGANIZATION_CREATED",
			"organization",
			organization.id,
			{
				name,
				slug,
			},
		);
		return reply.status(201).send({ data: organization });
	});

	fastify.get("/me", { preHandler: [authenticate] }, async (request, reply) => {
		const organizations = await listUserOrganizations(request.user.sub);
		return reply.send({ data: organizations });
	});

	fastify.delete(
		"/:id",
		{ preHandler: [authenticate, requireRole("ADMIN")] },
		async (request, reply) => {
			const { id } = request.params as { id: string };
			const organization = await findOrganizationById(id);

			if (!organization) {
				return reply.status(404).send({
					error: "Not Found",
					message: "Organization not found",
				});
			}

			await deleteOrganization(id);

			await writeAuditLog(
				request.user.sub,
				null,
				"ORGANIZATION_DELETED",
				"organization",
				id,
				{
					name: organization.name,
					slug: organization.slug,
				},
			);
			return reply.status(204).send();
		},
	);
};
