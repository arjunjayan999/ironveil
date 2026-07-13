import { logger } from "@ironveil/logger";
import type { KafkaEnvelope, SensorEvent } from "@ironveil/shared-types";
import { Kafka, type Producer } from "kafkajs";
import { config } from "../config.js";

const kafka = new Kafka({
	clientId: "ironveil-sensor-simulator",
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

const TOPIC_MAP: Record<SensorEvent["sourceType"], string> = {
	drone: "drone-events",
	radar: "radar-events",
	cyber: "cyber-events",
};

export async function publishSensorEvent(event: SensorEvent): Promise<void> {
	const p = await getProducer();
	const topic = TOPIC_MAP[event.sourceType];

	const envelope: KafkaEnvelope<SensorEvent> = {
		messageId: crypto.randomUUID(),
		timestamp: new Date().toISOString(),
		version: "1.0",
		payload: event,
	};

	await p.send({
		topic,
		messages: [
			{
				key: `${event.organizationId}:${event.sourceId}`,
				value: JSON.stringify(envelope),
			},
		],
	});

	logger.debug(
		{
			organizationId: event.organizationId,
			topic,
			sourceId: event.sourceId,
			sourceType: event.sourceType,
		},
		"Sensor event published",
	);
}
