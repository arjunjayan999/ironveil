import { logger } from "@ironveil/logger";
import type { WSMessage } from "@ironveil/shared-types";
import type { WebSocket } from "ws";
import { wsConnectedUsers } from "../metrics/index.js";

interface ConnectedClient {
	socket: WebSocket;
	userId: string;
	organizationId: string;
}

class Broadcaster {
	private readonly organizations = new Map<string, Set<ConnectedClient>>();

	add(client: ConnectedClient): void {
		const clients = this.organizations.get(client.organizationId);
		if (!this.organizations.has(client.organizationId)) {
			this.organizations.set(client.organizationId, new Set());
		}
		clients?.add(client);
		wsConnectedUsers.inc();
		logger.info(
			{
				connectedClients: clients?.size || 0,
				organizationId: client.organizationId,
				userId: client.userId,
			},
			"Websocket client connected",
		);
	}

	remove(client: ConnectedClient): void {
		const clients = this.organizations.get(client.organizationId);
		if (!clients) return;
		clients?.delete(client);
		if (clients?.size === 0) {
			this.organizations.delete(client.organizationId);
		}
		wsConnectedUsers.dec();
		logger.info(
			{
				connectedClients: clients?.size || 0,
				organizationId: client.organizationId,
				userId: client.userId,
			},
			"WebSocket client disconnected",
		);
	}

	broadcast<T>(organizationId: string, message: WSMessage<T>): void {
		const data = JSON.stringify(message);
		let sent = 0;
		const clients = this.organizations.get(organizationId);
		if (!clients) return;
		for (const client of clients) {
			if (client.socket.readyState !== 1) continue;
			client.socket.send(data);
			sent++;
		}
		logger.debug(
			{
				event: message.event,
				organizationId,
				recipients: sent,
			},
			"Organization broadcast",
		);
	}

	count(organizationId: string): number {
		return this.organizations.get(organizationId)?.size || 0;
	}
}

export const broadcaster = new Broadcaster();
