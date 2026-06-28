import { logger } from "@ironveil/logger";
import pg from "pg";
import { config } from "../config.js";

export const pool = new pg.Pool({
	connectionString: config.databaseUrl,
	max: 20,
	idleTimeoutMillis: 30_000,
	connectionTimeoutMillis: 5_000,
});

pool.on("error", (err) => {
	logger.error({ err }, "Unexpected PostgreSQL pool error");
});

export async function checkDbConnection(): Promise<void> {
	const client = await pool.connect();
	await client.query("SELECT 1");
	client.release();
}
