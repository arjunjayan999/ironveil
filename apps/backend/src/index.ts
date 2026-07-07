import { logger } from "@ironveil/logger";
import { buildApp } from "./app.js";
import { config } from "./config.js";
import { checkDbConnection } from "./db/client.js";
import { startConsumer, stopConsumer } from "./kafka/consumer.js";
import { disconnectProducer, getProducer } from "./kafka/producer.js";
import { redis } from "./redis/client.js";

async function main() {
	logger.info("Connecting to PostgreSQL...");
	await checkDbConnection();
	logger.info("PostgreSQL Connected");

	await redis.ping();
	logger.info("Redis Connected");

	await getProducer();
	await startConsumer();

	const app = await buildApp();
	await app.listen({ port: config.port, host: "0.0.0.0" });

	logger.info(`Backend listening on port ${config.port}`);

	const shutdown = async (signal: string) => {
		logger.info({ signal }, "Shutting down gracefully...");
		await app.close();
		await stopConsumer();
		await disconnectProducer();
		await redis.quit();
		logger.info("Shutdown complete");
		process.exit(0);
	};

	process.on("SIGTERM", () => shutdown("SIGTERM"));
	process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
	logger.error({ err }, "Failed to start backend");
	process.exit(1);
});
