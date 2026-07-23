import { logger } from "@ironveil/logger";
import type { KafkaEnvelope } from "@ironveil/shared-types";
import { type Consumer, Kafka } from "kafkajs";
import { config } from "../config.js";
import { generateOrGetSummary } from "../handlers/summary.js";
import type { AIProvider } from "../providers/interface.js";

interface ThreatEventPayload {
	threatId: string;
	threatLevel: "LOW" | "MEDIUM" | "HIGH";
}

const LEVELS_TO_SUMMARISE: Record<string, boolean> = {
	HIGH: true,
	MEDIUM:
		config.minSummaryLevel === "MEDIUM" || config.minSummaryLevel === "LOW",
	LOW: config.minSummaryLevel === "LOW",
};

const kafka = new Kafka({
	clientId: "ironveil-ai-service",
	brokers: config.kafkaBrokers,
});

let consumer: Consumer | null = null;

export async function startConsumer(provider: AIProvider): Promise<void> {
	consumer = kafka.consumer({ groupId: "ai-service" });
	await consumer.connect();
	await consumer.subscribe({ topics: ["threat-events"], fromBeginning: false });

	logger.info("AI Service Kafka consumer started");

	await consumer.run({
		autoCommit: true,
		eachMessage: async ({ message }) => {
			if (!message.value) return;

			let envelope: KafkaEnvelope<ThreatEventPayload>;
			try {
				envelope = JSON.parse(
					message.value.toString(),
				) as KafkaEnvelope<ThreatEventPayload>;
			} catch {
				return;
			}

			const { threatId, threatLevel } = envelope.payload;

			if (!LEVELS_TO_SUMMARISE[threatLevel]) {
				logger.debug(
					{ threatId, threatLevel },
					"Skipping summary - below min level",
				);
				return;
			}
			generateOrGetSummary(threatId, provider).catch((err) => {
				logger.error({ err, threatId }, "Background summary generation failed");
			});
		},
	});
}

export async function stopConsumer(): Promise<void> {
	if (consumer) {
		await consumer.disconnect();
		consumer = null;
	}
}
