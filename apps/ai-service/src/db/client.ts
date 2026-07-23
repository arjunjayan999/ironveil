import { logger } from "@ironveil/logger";
import pg from "pg";
import { config } from "../config.js";

export const pool = new pg.Pool({
	connectionString: config.databaseUrl,
	max: 5,
	idleTimeoutMillis: 30_000,
});

pool.on("error", (err) => logger.error({ err }, "PostgreSQL pool error"));

export async function checkDbConnection(): Promise<void> {
	const client = await pool.connect();
	await client.query("SELECT 1");
	client.release();
}
