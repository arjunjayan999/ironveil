import type { Threat } from "@ironveil/shared-types";
import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { findAlertByThreatId } from "../db/queries/alerts.js";
import { writeAuditLog } from "../db/queries/audit.js";
import {
	findThreatById,
	listThreats,
	updateThreatStatus,
} from "../db/queries/threats.js";
import { publishThreatUpdatedEvent } from "../kafka/producer.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { getCached, invalidateCache, setCache } from "../redis/client.js";

const listQuerySchema = z.object({
	level: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
	status: z.enum(["OPEN", "UNDER_REVIEW", "ESCALATED", "RESOLVED"]).optional(),
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const threatRoutes: FastifyPluginAsync = async (fastify) => {
	fastify.get("/", { preHandler: [authenticate] }, async (request, reply) => {
		const { organizationId } = request.params as { organizationId: string };
		const filter = listQuerySchema.parse(request.query);
		const { data, total } = await listThreats(organizationId, filter);
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

	fastify.get(
		"/:id",
		{ preHandler: [authenticate] },
		async (request, reply) => {
			const { organizationId, id } = request.params as {
				organizationId: string;
				id: string;
			};
			const cacheKey = `cache:${organizationId}:threat:${id}`;

			const cached = await getCached<Threat>(cacheKey);
			if (cached) return reply.send({ data: cached });

			const threat = await findThreatById(organizationId, id);
			if (!threat) {
				return reply
					.status(404)
					.send({ error: "Not Found", message: `Threat ${id} not found` });
			}

			const alert = await findAlertByThreatId(organizationId, id);

			const response = { ...threat, alert: alert ?? null };

			await setCache(cacheKey, response);
			return reply.send({ data: response });
		},
	);

	fastify.post(
		"/:id/escalate",
		{ preHandler: [authenticate, requireRole("ADMIN", "COMMANDER")] },
		async (request, reply) => {
			const { organizationId, id } = request.params as {
				organizationId: string;
				id: string;
			};
			const threat = await findThreatById(organizationId, id);
			if (!threat) {
				return reply
					.status(404)
					.send({ error: "Not Found", message: `Threat ${id} not found` });
			}
			if (threat.status === "ESCALATED") {
				return reply.status(400).send({
					error: "Bad Request",
					message: `Threat is already escalated`,
				});
			}
			if (threat.status === "RESOLVED") {
				return reply.status(400).send({
					error: "Bad Request",
					message: `Cannot escalate a resolved threat`,
				});
			}

			const updated = await updateThreatStatus(organizationId, id, "ESCALATED");
			await invalidateCache(`cache:${organizationId}:threat:${id}`);
			await publishThreatUpdatedEvent(
				organizationId,
				id,
				threat.status,
				"ESCALATED",
			);
			await writeAuditLog(
				request.user.sub,
				organizationId,
				"THREAT_ESCALATED",
				"threat",
				id,
				{
					previousStatus: threat.status,
				},
			);
			return reply.send({ data: updated });
		},
	);

	fastify.post(
		"/:id/resolve",
		{ preHandler: [authenticate, requireRole("ADMIN", "COMMANDER")] },
		async (request, reply) => {
			const { organizationId, id } = request.params as {
				organizationId: string;
				id: string;
			};
			const threat = await findThreatById(organizationId, id);
			if (!threat) {
				return reply
					.status(404)
					.send({ error: "Not Found", message: `Threat ${id} not found` });
			}
			if (threat.status === "RESOLVED") {
				return reply.status(400).send({
					error: "Bad Request",
					message: `Threat is already resolved`,
				});
			}
			const updated = await updateThreatStatus(organizationId, id, "RESOLVED");
			await invalidateCache(`cache:${organizationId}:threat:${id}`);
			await publishThreatUpdatedEvent(
				organizationId,
				id,
				threat.status,
				"RESOLVED",
			);
			return reply.send({ data: updated });
		},
	);
};
