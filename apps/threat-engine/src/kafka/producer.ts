import { logger } from "@ironveil/logger";
import type {
	KafkaEnvelope,
	ScoreBreakdown,
	ThreatLevel,
	ThreatStatus,
} from "@ironveil/shared-types";
import { Kafka, type Producer } from "kafkajs";
import { config } from "../config.js";

const kafka = new Kafka({
	clientId: "ironveil-threat-engine",
	brokers: config.kafkaBrokers,
	retry: { initialRetryTime: 100, retries: 5 },
});

let producer: Producer | null = null;

export async function getProducer(): Promise<Producer> {
	if (!producer) {
		producer = kafka.producer({ allowAutoTopicCreation: false });
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

export interface PublishThreatEventParams {
	organizationId: string;
	id: string;
	eventId: string;
	threatScore: number;
	threatLevel: ThreatLevel;
	status: ThreatStatus;
	scoreBreakdown: ScoreBreakdown;
}

export async function publishThreatEvent(
	params: PublishThreatEventParams,
): Promise<void> {
	const p = await getProducer();
	const envelope: KafkaEnvelope<PublishThreatEventParams> = {
		messageId: crypto.randomUUID(),
		timestamp: new Date().toISOString(),
		version: "1.0",
		payload: params,
	};

	await p.send({
		topic: "threat-events",
		messages: [
			{
				key: params.id,
				value: JSON.stringify(envelope),
			},
		],
	});
}

export async function publishAuditEvent(
	organizationId: string,
	action: string,
	entityType: string,
	entityId: string,
	metadata?: Record<string, unknown>,
): Promise<void> {
	const p = await getProducer();
	const envelope: KafkaEnvelope<{
		userId: null;
		organizationId: string;
		action: string;
		entityType: string;
		entityId: string;
		metadata: Record<string, unknown> | undefined;
	}> = {
		messageId: crypto.randomUUID(),
		timestamp: new Date().toISOString(),
		version: "1.0",
		payload: {
			userId: null,
			organizationId,
			action,
			entityType,
			entityId,
			metadata,
		},
	};

	await p.send({
		topic: "audit-events",
		messages: [{ key: entityId, value: JSON.stringify(envelope) }],
	});
}
