import { logger } from "@ironveil/logger";
import { config } from "./config.js";
import { checkDbConnection } from "./db/client.js";
import { startConsumer, stopConsumer } from "./kafka/consumer.js";
import { GeminiProvider } from "./providers/gemini.js";
import type { AIProvider } from "./providers/interface.js";
import { OllamaProvider } from "./providers/ollama.js";
import { ensureCollection } from "./qdrant/client.js";
import { startServer } from "./server/index.js";

async function main(): Promise<void> {
	logger.info(`Starting AI Service (provider: ${config.aiProvider})...`);
	await checkDbConnection();
	logger.info("PostgreSQL connected");

	let provider: AIProvider;
	if (config.aiProvider === "ollama") {
		provider = new OllamaProvider();
		logger.info({ model: config.ollamaSummaryModel }, "Using Ollama provider");
	} else {
		provider = new GeminiProvider();
		logger.info({ model: config.geminiSummaryModel }, "Using Gemini provider");
	}

	await ensureCollection(provider.embeddingDimension);

	await startConsumer(provider);

	startServer(config.healthPort, provider);

	logger.info("AI Service is running");

	const shutdown = async (signal: string) => {
		logger.info({ signal }, "Shutting down AI Service...");
		await stopConsumer();
		logger.info("Shutdown complete");
		process.exit(0);
	};

	process.on("SIGTERM", () => shutdown("SIGTERM"));
	process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
	logger.error({ err }, "AI Service failed to start");
	process.exit(1);
});
