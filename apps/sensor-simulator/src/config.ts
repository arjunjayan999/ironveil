import { z } from "zod";

const schema = z.object({
	nodeEnv: z.enum(["development", "production", "test"]).default("development"),
	serviceName: z.string().default("unknown-service"),
	logLevel: z.string().default("info"),
	databaseUrl: z.string().min(1, "DATABASE_URL is required"),
	fleetSize: z.coerce.number().min(1).max(100).default(15),
	centerLat: z.coerce.number().default(50.5),
	centerLon: z.coerce.number().default(4.0),
	emitIntervalMs: z.coerce.number().min(100).default(2000),
	healthPort: z.coerce.number().default(3002),
	kafkaBrokers: z
		.string()
		.min(1, "KAFKA_BROKERS is required")
		.transform((s) => s.split(",")),
});

const result = schema.safeParse({
	nodeEnv: process.env.NODE_ENV,
	serviceName: process.env.SERVICE_NAME,
	logLevel: process.env.LOG_LEVEL,
	databaseUrl: process.env.DATABASE_URL,
	fleetSize: process.env.FLEET_SIZE,
	centerLat: process.env.CENTER_LAT,
	centerLon: process.env.CENTER_LON,
	emitIntervalMs: process.env.EMIT_INTERVAL_MS,
	healthPort: process.env.HEALTH_PORT,
	kafkaBrokers: process.env.KAFKA_BROKERS,
});

if (!result.success) {
	console.error("Invalid configuration:\n");
	for (const issue of result.error.issues) {
		console.error(`${issue.path.join(".")}: ${issue.message}`);
	}
	process.exit(1);
}

export const config = result.data;
