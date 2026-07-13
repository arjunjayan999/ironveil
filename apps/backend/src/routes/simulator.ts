import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { config } from "../config.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";

const SIMULATOR_URL = config.simulatorUrl;

const bodySchema = z.object({
	scenario: z.enum(["mass-incursion", "cyber-attack", "quiet"]),
});

export const simulatorRoutes: FastifyPluginAsync = async (fastify) => {
	fastify.post(
		"/scenario",
		{
			preHandler: [authenticate, requireRole("ADMIN")],
		},
		async (request, reply) => {
			const { organizationId } = request.params as { organizationId: string };
			const result = bodySchema.safeParse(request.body);
			if (!result.success) {
				return reply
					.status(400)
					.send({ error: "Bad Request", message: result.error.message });
			}

			const response = await fetch(`${SIMULATOR_URL}/scenario`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ organizationId, ...result.data }),
			});
			if (!response.ok) {
				return reply.status(502).send({
					error: "Bad Gateway",
					message: "Simulator service returned an error",
				});
			}
			return reply.send({ ok: true, scenario: result.data.scenario });
		},
	);

	fastify.post(
		"/start",
		{
			preHandler: [authenticate, requireRole("ADMIN")],
		},
		async (request, reply) => {
			const { organizationId } = request.params as { organizationId: string };

			const response = await fetch(`${SIMULATOR_URL}/start`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ organizationId }),
			});

			if (!response.ok) {
				return reply.status(502).send({
					error: "Bad Gateway",
					message: "Simulator service returned an error",
				});
			}

			return reply.send({
				ok: true,
				organizationId,
				running: true,
			});
		},
	);

	fastify.post(
		"/stop",
		{
			preHandler: [authenticate, requireRole("ADMIN")],
		},
		async (request, reply) => {
			const { organizationId } = request.params as { organizationId: string };

			const response = await fetch(`${SIMULATOR_URL}/stop`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ organizationId }),
			});

			if (!response.ok) {
				return reply.status(502).send({
					error: "Bad Gateway",
					message: "Simulator service returned an error",
				});
			}

			return reply.send({
				ok: true,
				organizationId,
				running: false,
			});
		},
	);
};
