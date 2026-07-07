import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { listAuditLogs } from "../db/queries/audit.js";
import { authenticate } from "../middleware/auth.js";

const querySchema = z.object({
	userId: z.uuid().optional(),
	action: z.string().optional(),
	from: z.iso.datetime().optional(),
	to: z.iso.datetime().optional(),
	page: z.coerce.number().min(1).default(1),
	limit: z.coerce.number().min(1).max(100).default(50),
});

export const auditRoutes: FastifyPluginAsync = async (fastify) => {
	fastify.get("/", { preHandler: [authenticate] }, async (request, reply) => {
		const { organizationId } = request.params as { organizationId: string };
		const filter = querySchema.parse(request.query);
		const { data, total } = await listAuditLogs(organizationId, filter);
		return reply.send({
			data,
			meta: {
				total,
				page: filter.page,
				limit: filter.limit,
				totalPages: Math.ceil(total / filter.limit),
			},
		});
	});
};
