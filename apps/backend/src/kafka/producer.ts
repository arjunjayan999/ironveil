import { logger } from "@ironveil/logger";
import type {
	AuditAction,
	AuditEntityType,
	KafkaEnvelope,
} from "@ironveil/shared-types";
import { Kafka, type Producer } from "kafkajs";
import { config } from "../config.js";

const kafka = new Kafka({
	clientId: "ironveil-backend",
	brokers: config.kafkaBrokers,
	retry: { initialRetryTime: 100, retries: 5 },
});

let producer: Producer | null = null;

export async function getProducer(): Promise<Producer> {
	if (!producer) {
		producer = kafka.producer();
		await producer.connect();
		logger.info("Kafka producer connected");
	}
	return producer;
}

export async function disconnectProducer(): Promise<void> {
	if (producer) {
		await producer.disconnect();
		producer = null;
	}
}

export async function publishAuditEvent(
	userId: string | null,
	organizationId: string,
	action: AuditAction,
	entityType: AuditEntityType,
	entityId: string,
	metadata: Record<string, unknown>,
): Promise<void> {
	const p = await getProducer();
	const envelope: KafkaEnvelope<{
		userId: string | null;
		organizationId: string;
		action: AuditAction;
		entityType: AuditEntityType;
		entityId: string;
		metadata: Record<string, unknown>;
	}> = {
		messageId: crypto.randomUUID(),
		timestamp: new Date().toISOString(),
		version: "1.0",
		payload: { userId, organizationId, action, entityType, entityId, metadata },
	};
	await p.send({
		topic: "audit-events",
		messages: [{ key: entityId, value: JSON.stringify(envelope) }],
	});
}
