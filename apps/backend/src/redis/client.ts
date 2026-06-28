import { logger } from "@ironveil/logger";
import { Redis } from "ioredis";
import { config } from "../config.js";

export const redis = new Redis(config.redisUrl, {
	maxRetriesPerRequest: 3,
	enableReadyCheck: true,
	lazyConnect: false,
});

redis.on("connect", () => logger.info("Redis connected"));
redis.on("error", (err) => logger.error({ err }, "Redis error"));

export async function getMetricCounters(orgId: string) {
	const [high, medium, low, alerts] = await redis.mget(
		`org:${orgId}:counters:high-threat`,
		`org:${orgId}:counters:medium-threat`,
		`org:${orgId}:counters:low-threat`,
		`org:${orgId}:counters:active-alerts`,
	);
	return {
		highCount: parseInt(high ?? "0", 10),
		mediumCount: parseInt(medium ?? "0", 10),
		lowCount: parseInt(low ?? "0", 10),
		activeAlerts: parseInt(alerts ?? "0", 10),
	};
}

export const CACHE_TTL_SECONDS = 300;

export async function getCached<T>(key: string): Promise<T | null> {
	const value = await redis.get(key);
	return value ? (JSON.parse(value) as T) : null;
}

export async function setCache(
	key: string,
	value: unknown,
	ttl = CACHE_TTL_SECONDS,
) {
	await redis.setex(key, ttl, JSON.stringify(value));
}

export async function invalidateCache(key: string) {
	await redis.del(key);
}
