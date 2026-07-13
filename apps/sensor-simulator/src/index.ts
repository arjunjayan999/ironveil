import { logger } from "@ironveil/logger";
import type { SensorEvent } from "@ironveil/shared-types";
import { config } from "./config.js";
import { clearZoneCache, initZones } from "./db/queries/zones.js";
import { generateCyberEvent } from "./generators/cyber.js";
import {
	destroyFleet,
	generateDroneEvent,
	initFleet,
} from "./generators/drone.js";
import { generateRadarEvent } from "./generators/radar.js";
import {
	disconnectProducer,
	getProducer,
	publishSensorEvent,
} from "./kafka/producer.js";
import { getMode } from "./scenarios/index.js";
import { startServer } from "./server/index.js";

const EVENT_WEIGHTS = {
	drone: 0.6,
	radar: 0.3,
	cyber: 0.1,
} as const;

function pickEventType(organizationId: string): SensorEvent["sourceType"] {
	const mode = getMode(organizationId);

	if (mode === "cyber-attack") return "cyber";

	if (mode === "mass-incursion") return "drone";

	const roll = Math.random();
	if (roll < EVENT_WEIGHTS.drone) return "drone";
	if (roll < EVENT_WEIGHTS.drone + EVENT_WEIGHTS.radar) return "radar";
	return "cyber";
}

async function emitOneTick(organizationId: string): Promise<void> {
	const mode = getMode(organizationId);

	if (mode === "quiet") {
		logger.debug("Quiet scenario active - skipping tick");
		return;
	}

	const sourceType = pickEventType(organizationId);

	let event: SensorEvent;
	switch (sourceType) {
		case "drone":
			event = await generateDroneEvent(organizationId);
			break;
		case "radar":
			event = await generateRadarEvent(organizationId);
			break;
		case "cyber":
			event = await generateCyberEvent(organizationId);
			break;
	}

	await publishSensorEvent(event);
}

export async function startGenerator(organizationId: string): Promise<void> {
	if (organizationGenerators.has(organizationId)) {
		return;
	}
	await initZones(organizationId);

	initFleet(organizationId);

	const interval = setInterval(async () => {
		try {
			await emitOneTick(organizationId);
		} catch (err) {
			logger.error({ err, organizationId }, "Error during emit tick");
		}
	}, config.emitIntervalMs);
	organizationGenerators.set(organizationId, interval);
}

export function stopGenerator(organizationId: string): void {
	const interval = organizationGenerators.get(organizationId);

	if (!interval) {
		return;
	}
	clearInterval(interval);

	organizationGenerators.delete(organizationId);
	destroyFleet(organizationId);
	clearZoneCache(organizationId);
}

const organizationGenerators = new Map<string, NodeJS.Timeout>();

async function main(): Promise<void> {
	logger.info("Starting Sensor Simulator...");

	await getProducer();

	startServer(config.healthPort);

	logger.info(
		{
			fleetSize: config.fleetSize,
			emitIntervalMs: config.emitIntervalMs,
		},
		"Sensor Simulator running",
	);

	const shutdown = async (signal: string) => {
		logger.info({ signal }, "Shutting down Sensor Simulator...");
		for (const interval of organizationGenerators.values()) {
			clearInterval(interval);
		}
		organizationGenerators.clear();
		await disconnectProducer();
		logger.info("Shutdown complete");
		process.exit(0);
	};

	process.on("SIGTERM", () => shutdown("SIGTERM"));
	process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
	logger.error({ err }, "Sensor Simulator failed to start");
	process.exit(1);
});
