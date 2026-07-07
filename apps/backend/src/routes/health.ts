import type { FastifyPluginAsync } from "fastify";
import { checkDbConnection } from "../db/client.js";
import { register } from "../metrics/index.js";
import { redis } from "../redis/client.js";

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
	fastify.get("/healthz", async (_request, reply) => {
		try {
			await checkDbConnection();
			await redis.ping();
			return reply.send({
				status: "ok",
				uptime: process.uptime(),
			});
		} catch (err) {
			return reply.status(503).send({
				status: "error",
				error: String(err),
			});
		}
	});

	fastify.get("/metrics", async (_request, reply) => {
		const metrics = await register.metrics();
		return reply.header("Content-Type", register.contentType).send(metrics);
	});
};
