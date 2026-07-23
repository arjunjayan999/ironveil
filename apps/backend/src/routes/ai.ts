import { logger } from "@ironveil/logger";
import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { config } from "../config.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";

async function callAiService<T>(
	path: string,
	method: "GET" | "POST",
	body?: unknown,
): Promise<T> {
	const response = await fetch(`${config.aiServiceUrl}${path}`, {
		method,
		headers: { "Content-Type": "application/json" },
		...(body !== undefined && {
			body: JSON.stringify(body),
		}),
	});

	if (!response.ok) {
		const err = (await response
			.json()
			.catch(() => ({ error: response.statusText }))) as { error?: string };
		throw new Error(err.error ?? "AI Service error");
	}

	return response.json() as Promise<T>;
}

export const aiRoutes: FastifyPluginAsync = async (fastify) => {
	fastify.post(
		"/summary",
		{ preHandler: authenticate },
		async (request, reply) => {
			const schema = z.object({
				threatId: z.uuid(),
				force: z.boolean().optional(),
			});

			const result = schema.safeParse(request.body);
			if (!result.success) {
				return reply.status(400).send({
					error: "Bad Request",
					message: "threatId (UUID) is required",
				});
			}

			try {
				const data = await callAiService(
					"/internal/summary",
					"POST",
					result.data,
				);
				return reply.send(data);
			} catch (err) {
				logger.error({ err }, "AI summary request failed");
				return reply.status(502).send({
					error: "AI Service Unavailable",
					message:
						err instanceof Error ? err.message : "Could not reach AI service",
				});
			}
		},
	);
	fastify.post(
		"/report",
		{
			preHandler: [authenticate, requireRole("ADMIN", "COMMANDER")],
		},
		async (request, reply) => {
			const schema = z.object({
				threatIds: z.array(z.string().uuid()).min(1).max(20),
			});

			const result = schema.safeParse(request.body);
			if (!result.success) {
				return reply
					.status(400)
					.send({ error: "Bad Request", message: result.error.message });
			}

			try {
				const data = await callAiService(
					"/internal/report",
					"POST",
					result.data,
				);
				return reply.send(data);
			} catch (err) {
				logger.error({ err }, "AI report request failed");
				return reply.status(502).send({ error: "AI Service Unavailable" });
			}
		},
	);
	fastify.post(
		"/search",
		{ preHandler: authenticate },
		async (request, reply) => {
			const schema = z.object({
				query: z.string().min(1).max(500),
				limit: z.number().min(1).max(20).optional(),
			});

			const result = schema.safeParse(request.body);
			if (!result.success) {
				return reply
					.status(400)
					.send({ error: "Bad Request", message: result.error.message });
			}

			try {
				const data = await callAiService(
					"/internal/search",
					"POST",
					result.data,
				);
				return reply.send(data);
			} catch (err) {
				logger.error({ err }, "AI search request failed");
				return reply.status(502).send({ error: "AI Service Unavailable" });
			}
		},
	);

	fastify.get(
		"/similar/:threatId",
		{ preHandler: authenticate },
		async (request, reply) => {
			const { threatId } = request.params as { threatId: string };

			try {
				const data = await callAiService(
					`/internal/similar/${threatId}`,
					"GET",
				);
				return reply.send(data);
			} catch (err) {
				logger.error({ err, threatId }, "AI similar request failed");
				return reply.status(502).send({ error: "AI Service Unavailable" });
			}
		},
	);
};
