import cors from "@fastify/cors";
import fjwt from "@fastify/jwt";
import webSocketPlugin from "@fastify/websocket";
import { type Logger, logger } from "@ironveil/logger";
import type { FastifyError } from "fastify";
import Fastify from "fastify";
import { config } from "./config.js";
import { httpRequestDuration, httpRequestsTotal } from "./metrics/index.js";
import { aiRoutes } from "./routes/ai.js";
import { alertRoutes } from "./routes/alerts.js";
import { auditRoutes } from "./routes/audit.js";
import { authRoutes } from "./routes/auth.js";
import { healthRoutes } from "./routes/health.js";
import { organizationInvitationRoutes } from "./routes/invitations.js";
import { organizationMemberRoutes } from "./routes/organizationMembers.js";
import { organizationRoutes } from "./routes/organizations.js";
import { simulatorRoutes } from "./routes/simulator.js";
import { threatRoutes } from "./routes/threats.js";
import { userRoutes } from "./routes/users.js";
import { websocketRoutes } from "./routes/websocket.js";
import { zoneRoutes } from "./routes/zones.js";

export async function buildApp() {
	const fastify = Fastify({
		loggerInstance: logger as Logger,
		trustProxy: true,
	});

	await fastify.register(cors, {
		origin: config.nodeEnv === "production" ? config.frontendUrl : true,
		credentials: true,
	});

	await fastify.register(fjwt, {
		secret: config.jwtSecret,
	});

	await fastify.register(webSocketPlugin);

	fastify.addHook("onResponse", (request, reply, done) => {
		const route = request.routeOptions.url ?? request.url;
		const labels = {
			method: request.method,
			route,
			status: String(reply.statusCode),
		};
		httpRequestsTotal.inc(labels);
		httpRequestDuration.observe(labels, reply.elapsedTime / 1000);
		done();
	});

	fastify.setErrorHandler((error: FastifyError, request, reply) => {
		logger.error({ err: error, url: request.url }, "Unhandled error");
		const statusCode = error.statusCode ?? 500;
		return reply.status(statusCode).send({
			error: statusCode === 500 ? "Internal Server Error" : error.message,
			message:
				statusCode === 500 ? "An unexpected error occurred" : error.message,
		});
	});

	await fastify.register(healthRoutes);
	await fastify.register(websocketRoutes);
	await fastify.register(aiRoutes, { prefix: "/api/v1/ai" });
	await fastify.register(simulatorRoutes, {
		prefix: "/api/v1/simulator/:organizationId",
	});
	await fastify.register(authRoutes, { prefix: "/api/v1/auth" });
	await fastify.register(userRoutes, { prefix: "/api/v1/users" });
	await fastify.register(organizationRoutes, {
		prefix: "/api/v1/organizations",
	});
	await fastify.register(organizationMemberRoutes, {
		prefix: "/api/v1/organizations/:organizationId/members",
	});
	await fastify.register(organizationInvitationRoutes, {
		prefix: "/api/v1/organizations/:organizationId/invitations",
	});
	await fastify.register(threatRoutes, {
		prefix: "/api/v1/organizations/:organizationId/threats",
	});
	await fastify.register(alertRoutes, {
		prefix: "/api/v1/organizations/:organizationId/alerts",
	});
	await fastify.register(zoneRoutes, {
		prefix: "/api/v1/organizations/:organizationId/zones",
	});
	await fastify.register(auditRoutes, {
		prefix: "/api/v1/organizations/:organizationId/audit",
	});

	return fastify;
}
