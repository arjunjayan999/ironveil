import cors from "@fastify/cors";
import fjwt from "@fastify/jwt";
import { type Logger, logger } from "@ironveil/logger";
import Fastify from "fastify";
import { config } from "../config.js";
import { startGenerator, stopGenerator } from "../index.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { activateScenario, type ScenarioName } from "../scenarios/index.js";

export async function startServer(port: number) {
	const app = Fastify({
		loggerInstance: logger as Logger,
		trustProxy: true,
	});

	await app.register(cors, {
		origin: config.nodeEnv === "production" ? config.frontendUrl : true,
		credentials: true,
	});

	await app.register(fjwt, {
		secret: config.jwtSecret,
	});

	app.post(
		"/api/v1/simulator/:organizationId/scenario",
		{ preHandler: [authenticate, requireRole("ADMIN")] },
		async (request, reply) => {
			const { organizationId } = request.params as { organizationId: string };

			const { scenario } = request.body as { scenario: ScenarioName };

			activateScenario(organizationId, scenario);
			reply.send({
				success: true,
				organizationId: organizationId,
				scenario: scenario,
			});
		},
	);

	app.post(
		"/api/v1/simulator/:organizationId/start",
		{ preHandler: [authenticate, requireRole("ADMIN")] },
		async (request, reply) => {
			const { organizationId } = request.params as { organizationId: string };
			await startGenerator(organizationId);
			reply.send({
				success: true,
				organizationId: organizationId,
				running: true,
			});
		},
	);

	app.post(
		"/api/v1/simulator/:organizationId/stop",
		{ preHandler: [authenticate, requireRole("ADMIN")] },
		async (request, reply) => {
			const { organizationId } = request.params as { organizationId: string };
			stopGenerator(organizationId);
			reply.send({
				success: true,
				organizationId: organizationId,
				running: false,
			});
		},
	);

	app.get("/healthz", async (_request, reply) => {
		return reply.send({
			status: "ok",
			uptime: process.uptime(),
		});
	});

	await app.listen({ port, host: "0.0.0.0" });
}
