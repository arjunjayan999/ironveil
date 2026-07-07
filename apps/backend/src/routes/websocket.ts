import { logger } from "@ironveil/logger";
import type { JWTPayload } from "@ironveil/shared-types";
import type { FastifyPluginAsync } from "fastify";
import { findMembership } from "../db/queries/organizationmembers.js";
import { broadcaster } from "../websocket/broadcaster.js";

export const websocketRoutes: FastifyPluginAsync = async (fastify) => {
	fastify.get(
		"/:organizationId/ws/events",
		{ websocket: true },
		async (socket, request) => {
			const query = request.query as { token?: string };
			const { organizationId } = request.params as { organizationId: string };
			const token = query.token;
			if (!token) {
				socket.close(4001, "Unauthorized: token query param required");
				return;
			}

			try {
				const payload = fastify.jwt.verify<JWTPayload>(token);
				logger.info(
					{ userId: payload.sub, username: payload.username },
					"WebSocket client authenticated",
				);
				const membership = await findMembership(organizationId, payload.sub);
				if (!membership) {
					socket.close(4003, "Forbidden");
					return;
				}
				const connectedClient = { socket, userId: payload.sub, organizationId };
				broadcaster.add(connectedClient);
				socket.send(
					JSON.stringify({
						event: "connected",
						timestamp: new Date().toISOString(),
						data: { message: "Connected to IronVeil live feed" },
					}),
				);

				socket.on("close", () => {
					broadcaster.remove(connectedClient);
				});

				socket.on("error", (err) => {
					logger.error({ err }, "WebSocket error");
					broadcaster.remove(connectedClient);
				});
			} catch {
				socket.close(4001, "Unauthorized or Unauthorized");
			}
		},
	);
};
