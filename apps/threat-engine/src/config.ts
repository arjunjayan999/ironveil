import { z } from "zod";

const schema = z.object({
	nodeEnv: z.enum(["development", "production", "test"]).default("development"),
	serviceName: z.string().default("unknown-service"),
	logLevel: z.string().default("info"),
	databaseUrl: z.string().min(1, "DATABASE_URL is required"),
	redisUrl: z.string().min(1, "REDIS_URL is required"),
	kafkaBrokers: z
		.string()
		.min(1, "KAFKA_BROKERS is required")
		.transform((s) => s.split(",")),
	kafkaHeartbeatIntervalMs: z.coerce.number().default(3000),
});

const result = schema.safeParse({
	nodeEnv: process.env.NODE_ENV,
	serviceName: process.env.SERVICE_NAME,
	logLevel: process.env.LOG_LEVEL,
	databaseUrl: process.env.DATABASE_URL,
	redisUrl: process.env.REDIS_URL,
	kafkaBrokers: process.env.KAFKA_BROKERS,
	kafkaHeartbeatIntervalMs: process.env.KAFKA_HEARTBEAT_INTERVAL_MS,
});

if (!result.success) {
	console.error("Invalid configuration:\n");
	for (const issue of result.error.issues) {
		console.error(`${issue.path.join(".")}: ${issue.message}`);
	}
	process.exit(1);
}

export const config = result.data;
