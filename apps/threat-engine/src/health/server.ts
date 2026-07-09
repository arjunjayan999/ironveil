import { createServer, type Server } from "node:http";
import { logger } from "@ironveil/logger";
import { pool } from "../db/client.js";
import { redis } from "../redis/client.js";

export function startHealthServer(port: number): Server {
	const server = createServer(async (req, res) => {
		if (req.url !== "/healthz") {
			res.writeHead(404);
			res.end(JSON.stringify({ error: "Not Found" }));
			return;
		}

		try {
			const client = await pool.connect();
			await client.query("SELECT 1");
			client.release();

			await redis.ping();

			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ status: "ok", uptime: process.uptime() }));
		} catch (err) {
			logger.error({ err }, "Health check failed");
			res.writeHead(503, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ status: "error", error: String(err) }));
		}
	});

	server.listen(port, "0.0.0.0", () => {
		logger.info({ port }, "Health server listening");
	});

	return server;
}
