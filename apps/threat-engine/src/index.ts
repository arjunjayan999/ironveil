import type { Server } from "node:http";
import { logger } from "@ironveil/logger";
import { config } from "./config.js";
import { checkDbConnection } from "./db/client.js";
import { startHealthServer } from "./health/server.js";
import { startConsumer, stopConsumer } from "./kafka/consumer.js";
import { disconnectProducer, getProducer } from "./kafka/producer.js";
import { redis } from "./redis/client.js";

async function main() {
	logger.info("Starting Threat Engine...");
	logger.info("Connecting to PostgreSQL...");
	await checkDbConnection();
	logger.info("PostgreSQL connected");

	await redis.ping();
	logger.info("Redis connected");

	await getProducer();

	await startConsumer();

	const healthServer: Server = startHealthServer(config.healthPort);

	logger.info("Threat Engine is running");

	const shutdown = async (signal: string) => {
		logger.info({ signal }, "Shutting down Threat Engine...");

		await stopConsumer();
		await disconnectProducer();
		await redis.quit();

		healthServer.close(() => {
			logger.info("Shutdown complete");
			process.exit(0);
		});
	};

	process.on("SIGTERM", () => shutdown("SIGTERM"));
	process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
	logger.error({ err }, "Threat Engine failed to start");
	process.exit(1);
});
