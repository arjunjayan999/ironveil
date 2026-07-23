import { z } from "zod";

const schema = z.object({
	nodeEnv: z.enum(["development", "production", "test"]).default("development"),
	serviceName: z.string().default("unknown-service"),
	logLevel: z.string().default("info"),
	geminiApiKey: z.string().optional(),
	geminiSummaryModel: z.string().default("gemini-2.5-flash"),
	geminiEmbeddingModel: z.string().default("text-embedding-004"),
	ollamaBaseUrl: z.string().default("http://localhost:11434"),
	ollamaSummaryModel: z.string().default("llama3.1"),
	ollamaEmbeddingModel: z.string().default("nomic-embed-text"),
	qdrantUrl: z.url().default("http://localhost:6333"),
	qdrantCollection: z.string().default("ironveil-threats"),
	databaseUrl: z.string().min(1, "DATABASE_URL is required"),
	kafkaBrokers: z
		.string()
		.min(1, "KAFKA_BROKERS is required")
		.transform((s) => s.split(",")),
	minSummaryLevel: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
	healthPort: z.coerce.number().default(3003),
	aiProvider: z.enum(["gemini", "ollama"]).default("gemini"),
});

const result = schema.safeParse({
	nodeEnv: process.env.NODE_ENV,
	serviceName: process.env.SERVICE_NAME,
	logLevel: process.env.LOG_LEVEL,
	geminiApiKey: process.env.GEMINI_API_KEY,
	geminiSummaryModel: process.env.GEMINI_SUMMARY_MODEL,
	geminiEmbeddingModel: process.env.GEMINI_EMBEDDING_MODEL,
	ollamaBaseUrl: process.env.OLLAMA_BASE_URL,
	ollamaSummaryModel: process.env.OLLAMA_SUMMARY_MODEL,
	ollamaEmbeddingModel: process.env.OLLAMA_EMBEDDING_MODEL,
	qdrantUrl: process.env.QDRANT_URL,
	qdrantCollection: process.env.QDRANT_COLLECTION,
	databaseUrl: process.env.DATABASE_URL,
	kafkaBrokers: process.env.KAFKA_BROKERS,
	minSummaryLevel: process.env.MIN_SUMMARY_LEVEL,
	healthPort: process.env.HEALTH_PORT,
	aiProvider: process.env.AI_PROVIDER,
});

if (!result.success) {
	console.error("Invalid configuration:\n");
	for (const issue of result.error.issues) {
		console.error(`${issue.path.join(".")}: ${issue.message}`);
	}
	process.exit(1);
}

export const config = result.data;
