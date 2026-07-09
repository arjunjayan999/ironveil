import { appendFile } from "node:fs/promises";
import { logger } from "@ironveil/logger";
import type { KafkaEnvelope, SensorEvent } from "@ironveil/shared-types";
import { type Consumer, type EachMessagePayload, Kafka } from "kafkajs";
import { config } from "../config.js";
import { insertAlert } from "../db/queries/alerts.js";
import { insertEvent } from "../db/queries/events.js";
import { insertThreat } from "../db/queries/threats.js";
import {
	incrementAlertCounter,
	incrementThreatCounter,
	markProcessed,
} from "../redis/client.js";
import { buildAlertMessage, scoreEvent } from "../scoring/engine.js";
import { publishAuditEvent, publishThreatEvent } from "./producer.js";

const SENSOR_TOPICS = ["drone-events", "radar-events", "cyber-events"] as const;

const DLQ_PATH = "/tmp/ironveil-dlq.jsonl";

const kafka = new Kafka({
	clientId: "ironveil-threat-engine-consumer",
	brokers: config.kafkaBrokers,
	retry: { initialRetryTime: 100, retries: 3 },
});

let consumer: Consumer | null = null;

export async function startConsumer(): Promise<void> {
	consumer = kafka.consumer({
		groupId: "threat-engine",
		heartbeatInterval: config.kafkaHeartbeatIntervalMs,
		sessionTimeout: 30_000,
	});

	await consumer.connect();

	await consumer.subscribe({
		topics: [...SENSOR_TOPICS],
		fromBeginning: false,
	});

	logger.info({ topics: SENSOR_TOPICS }, "Threat Engine consumer started");

	await consumer.run({
		autoCommit: false,
		eachMessage: async (payload) => {
			await handleMessage(payload);
		},
	});
}

async function handleMessage({
	topic,
	partition,
	message,
	heartbeat,
}: EachMessagePayload): Promise<void> {
	if (!message.value) return;

	const raw = message.value.toString();
	let envelope: KafkaEnvelope<SensorEvent>;

	try {
		envelope = JSON.parse(raw) as KafkaEnvelope<SensorEvent>;
	} catch (err) {
		logger.error(
			{ err, raw },
			"Failed to parse Kafka message - sending to DLQ",
		);
		await writeToDlq(raw, "JSON parse failed");
		if (!consumer) {
			throw new Error("Consumer not initialized");
		}
		await consumer.commitOffsets([
			{ topic, partition, offset: String(Number(message.offset) + 1) },
		]);
		return;
	}

	const isNew = await markProcessed(envelope.messageId);
	if (!isNew) {
		logger.warn(
			{ messageId: envelope.messageId },
			"Duplicate message detected - skipping",
		);
		if (!consumer) {
			throw new Error("Consumer not initialized");
		}
		await consumer.commitOffsets([
			{ topic, partition, offset: String(Number(message.offset) + 1) },
		]);
		return;
	}

	try {
		await processEvent(envelope.payload, topic);
		if (!consumer) {
			throw new Error("Consumer not initialized");
		}
		await consumer.commitOffsets([
			{ topic, partition, offset: String(Number(message.offset) + 1) },
		]);

		await heartbeat();
	} catch (err) {
		logger.error(
			{ err, messageId: envelope.messageId, topic },
			"Failed to process event - NOT committing offset (will retry)",
		);
		throw err;
	}
}

async function processEvent(event: SensorEvent, topic: string): Promise<void> {
	logger.info(
		{ sourceId: event.sourceId, sourceType: event.sourceType, topic },
		"Processing sensor event",
	);

	const eventId = await insertEvent(event);

	const { threatScore, threatLevel, scoreBreakdown } = scoreEvent(event);

	const threatId = await insertThreat({
		organizationId: event.organizationId,
		eventId,
		threatScore,
		threatLevel,
		status: "OPEN",
		scoreBreakdown,
	});

	await incrementThreatCounter(event.organizationId, threatLevel);

	if (threatLevel === "HIGH") {
		const alertMessage = buildAlertMessage(event, threatScore);
		await insertAlert(event.organizationId, threatId, alertMessage, "HIGH");
		await incrementAlertCounter(event.organizationId);

		logger.warn(
			{ threatId, threatScore, sourceId: event.sourceId },
			"HIGH threat detected - alert created",
		);
	}

	await publishThreatEvent({
		organizationId: event.organizationId,
		threatId,
		eventId,
		threatScore,
		threatLevel,
		status: "OPEN",
		scoreBreakdown,
	});

	await publishAuditEvent(
		event.organizationId,
		"THREAT_CREATED",
		"threat",
		threatId,
		{
			sourceId: event.sourceId,
			sourceType: event.sourceType,
			threatScore,
			threatLevel,
		},
	);

	logger.info(
		{ threatId, threatScore, threatLevel, sourceId: event.sourceId },
		"Event processed successfully",
	);
}

async function writeToDlq(rawMessage: string, reason: string): Promise<void> {
	const entry = JSON.stringify({
		timestamp: new Date().toISOString(),
		reason,
		message: rawMessage,
	});
	await appendFile(DLQ_PATH, `${entry}\n`);
	logger.error({ dlqPath: DLQ_PATH }, "Message written to dead-letter queue");
}

export async function stopConsumer(): Promise<void> {
	if (consumer) {
		await consumer.disconnect();
		consumer = null;
		logger.info("Kafka consumer disconnected");
	}
}
