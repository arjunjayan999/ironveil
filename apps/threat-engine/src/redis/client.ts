import { logger } from "@ironveil/logger";
import type { ThreatLevel } from "@ironveil/shared-types";
import { Redis } from "ioredis";
import { config } from "../config.js";

export const redis = new Redis(config.redisUrl, {
	maxRetriesPerRequest: 3,
	enableReadyCheck: true,
});

redis.on("connect", () => logger.info("Redis connected"));
redis.on("error", (err) => logger.error({ err }, "Redis error"));

const counterKey = (orgId: string, level: ThreatLevel) =>
	`org:${orgId}:counters:${level.toLowerCase()}-threat`;

export async function incrementThreatCounter(
	orgId: string,
	level: ThreatLevel,
): Promise<void> {
	await redis.incr(counterKey(orgId, level));
}

export async function incrementAlertCounter(orgId: string): Promise<void> {
	await redis.incr(`org:${orgId}:counters:active-alerts`);
}

export async function wasProcessed(messageId: string): Promise<boolean> {
	const exists = await redis.exists(`processed:${messageId}`);
	return exists === 1;
}

export async function markProcessed(messageId: string): Promise<void> {
	await redis.set(`processed:${messageId}`, "1", "EX", 3600);
}
