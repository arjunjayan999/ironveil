import { z } from "zod";

const schema = z.object({
	nodeEnv: z.enum(["development", "production", "test"]).default("development"),
	serviceName: z.string().default("unknown-service"),
	logLevel: z.string().default("info"),
});

const result = schema.safeParse({
	nodeEnv: process.env.NODE_ENV,
	serviceName: process.env.SERVICE_NAME,
	logLevel: process.env.LOG_LEVEL,
});

if (!result.success) {
	console.error("Invalid configuration:\n");
	for (const issue of result.error.issues) {
		console.error(`${issue.path.join(".")}: ${issue.message}`);
	}
	process.exit(1);
}

export const config = result.data;
export type Config = typeof config;
