import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { listAlerts } from "../db/queries/alerts.js";
import { authenticate } from "../middleware/auth.js";

const querySchema = z.object({
	severity: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
	page: z.coerce.number().min(1).default(1),
	limit: z.coerce.number().min(1).max(100).default(20),
});

export const alertRoutes: FastifyPluginAsync = async (fastify) => {
	fastify.get("/", { preHandler: [authenticate] }, async (request, reply) => {
		const { organizationId } = request.params as { organizationId: string };
		const { severity, page, limit } = querySchema.parse(request.query);
		const { data, total } = await listAlerts(
			organizationId,
			severity,
			page,
			limit,
		);
		return reply.send({
			data,
			meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
		});
	});
};
