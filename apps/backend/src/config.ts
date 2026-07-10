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
	frontendUrl: z
		.url()
		.default("http://localhost:5173")
		.transform((url) => url.replace(/\/$/, "")),
	jwtSecret: z.string().min(32, "JWT_SECRET must be atleast 32 characters"),
	port: z.coerce.number().int().min(1).max(65535).default(3000),
});

const result = schema.safeParse({
	nodeEnv: process.env.NODE_ENV,
	serviceName: process.env.SERVICE_NAME,
	logLevel: process.env.LOG_LEVEL,
	databaseUrl: process.env.DATABASE_URL,
	redisUrl: process.env.REDIS_URL,
	kafkaBrokers: process.env.KAFKA_BROKERS,
	frontendUrl: process.env.FRONTEND_URL,
	jwtSecret: process.env.JWT_SECRET,
	port: process.env.PORT,
});

if (!result.success) {
	console.error("Invalid configuration:\n");
	for (const issue of result.error.issues) {
		console.error(`${issue.path.join(".")}: ${issue.message}`);
	}
	process.exit(1);
}

export const config = result.data;
