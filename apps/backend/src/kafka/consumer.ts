import { logger } from "@ironveil/logger";
import type {
	KafkaEnvelope,
	Threat,
	ThreatUpdatedData,
	WSMessage,
} from "@ironveil/shared-types";
import { type Consumer, Kafka } from "kafkajs";
import { config } from "../config.js";
import { writeAuditLog } from "../db/queries/audit.js";
import { redis } from "../redis/client.js";
import { broadcaster } from "../websocket/broadcaster.js";

const kafka = new Kafka({
	clientId: "ironveil-backend-consumer",
	brokers: config.kafkaBrokers,
});

let consumer: Consumer | null = null;

export async function startConsumer(): Promise<void> {
	consumer = kafka.consumer({ groupId: "backend-ws-broadcaster" });
	await consumer.connect();
	await consumer.subscribe({
		topics: [
			"threat-events",
			"threat-updated-events",
			"audit-events",
			"alerts",
		],
		fromBeginning: false,
	});

	logger.info(
		"Kafka consumer started - subscribing to threat-events, threat-updated-events, audit-events, alerts",
	);

	await consumer.run({
		eachMessage: async ({ topic, message }) => {
			if (!message.value) return;

			try {
				const raw = JSON.parse(
					message.value.toString(),
				) as KafkaEnvelope<unknown>;
				if (topic === "threat-events") {
					await handleThreatEvent(raw as KafkaEnvelope<Threat>);
				} else if (topic === "threat-updated-events") {
					await handleThreatUpdatedEvent(
						raw as KafkaEnvelope<ThreatUpdatedData>,
					);
				} else if (topic === "audit-events") {
					await handleAuditEvent(raw);
				}
			} catch (err) {
				logger.error({ err, topic }, "Failed to process Kafka message");
			}
		},
	});
}

async function handleThreatEvent(
	envelope: KafkaEnvelope<Threat>,
): Promise<void> {
	const threat = envelope.payload;
	const wsMessage: WSMessage<Threat> = {
		event: "threat_created",
		timestamp: new Date().toISOString(),
		data: threat,
	};
	broadcaster.broadcast(threat.organizationId, wsMessage);
	await redis.del(`org:${threat.organizationId}:dashboard:metrics`);
	logger.info(
		{ threatId: threat.id, level: threat.threatLevel },
		"Threat event broadcast via WebSocket",
	);
}

async function handleThreatUpdatedEvent(
	envelope: KafkaEnvelope<ThreatUpdatedData>,
): Promise<void> {
	const p = envelope.payload;
	const wsMessage: WSMessage<ThreatUpdatedData> = {
		event: "threat_updated",
		timestamp: new Date().toISOString(),
		data: {
			organizationId: p.organizationId,
			threatId: p.threatId,
			oldStatus: p.oldStatus,
			newStatus: p.newStatus,
		},
	};
	broadcaster.broadcast(p.organizationId, wsMessage);
}

async function handleAuditEvent(
	envelope: KafkaEnvelope<unknown>,
): Promise<void> {
	const p = envelope.payload as {
		userId: string | null;
		organizationId: string;
		action: string;
		entityType: string;
		entityId: string;
		metadata?: Record<string, unknown>;
	};

	await writeAuditLog(
		p.userId,
		p.organizationId,
		p.action as never,
		p.entityType as never,
		p.entityId,
		p.metadata || null,
	);
}

export async function stopConsumer(): Promise<void> {
	if (consumer) {
		await consumer.disconnect();
		consumer = null;
	}
}
