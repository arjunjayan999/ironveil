import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { writeAuditLog } from "../db/queries/audit.js";
import { createZone, deleteZone, listZones } from "../db/queries/zones.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";

const createZoneSchema = z.object({
	name: z.string().min(1).max(128),
	latitude: z.number().min(-90).max(90),
	longitude: z.number().min(-180).max(180),
	radiusKm: z.number().positive(),
});

export const zoneRoutes: FastifyPluginAsync = async (fastify) => {
	fastify.get("/", { preHandler: authenticate }, async (request, reply) => {
		const { organizationId } = request.params as { organizationId: string };
		const zones = await listZones(organizationId);
		return reply.send({ data: zones });
	});

	fastify.post(
		"/",
		{ preHandler: [authenticate, requireRole("ADMIN")] },
		async (request, reply) => {
			const { organizationId } = request.params as { organizationId: string };
			const result = createZoneSchema.safeParse(request.body);
			if (!result.success) {
				return reply.status(400).send({
					error: "Bad Request",
					message: result.error.message,
				});
			}
			const { name, latitude, longitude, radiusKm } = result.data;
			const zone = await createZone(
				organizationId,
				name,
				latitude,
				longitude,
				radiusKm,
			);
			await writeAuditLog(
				request.user.sub,
				organizationId,
				"ZONE_CREATED",
				"zone",
				zone.id,
				{ name },
			);

			return reply.status(201).send({ data: zone });
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
			await deleteZone(organizationId, id);
			await writeAuditLog(
				request.user.sub,
				organizationId,
				"ZONE_DELETED",
				"zone",
				id,
				null,
			);
			return reply.status(204).send();
		},
	);
};
