import pino from "pino";

const serviceName = process.env.SERVICE_NAME ?? "unknown-service";
const logLevel = process.env.LOG_LEVEL ?? "info";

const options = {
	level: logLevel,
	base: {
		service: serviceName,
		env: process.env.NODE_ENV ?? "development",
	},
	...(process.env.NODE_ENV !== "production"
		? {
				transport: {
					target: "pino-pretty",
					options: {
						colorize: true,
						translateTime: "SYS:standard",
						ignore: "pid,hostname",
					},
				},
			}
		: {}),
};

export const logger = pino(options);

export type { Logger } from "pino";
