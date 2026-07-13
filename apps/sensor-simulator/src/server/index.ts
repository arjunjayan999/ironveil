import { createServer } from "node:http";
import { logger } from "@ironveil/logger";
import { startGenerator, stopGenerator } from "../index.js";
import { activateScenario, type ScenarioName } from "../scenarios/index.js";

export function startServer(port: number): void {
	const server = createServer(async (req, res) => {
		res.setHeader("Content-Type", "application/json");
		if (req.method === "GET" && req.url === "/healthz") {
			res.writeHead(200);
			res.end(
				JSON.stringify({
					status: "ok",
					uptime: process.uptime(),
				}),
			);
			return;
		}

		let body: Record<string, unknown> = {};

		if (req.method === "POST") {
			const chunks: Buffer[] = [];

			for await (const chunk of req) {
				chunks.push(chunk as Buffer);
			}

			if (chunks.length > 0) {
				try {
					body = JSON.parse(Buffer.concat(chunks).toString()) as Record<
						string,
						unknown
					>;
				} catch {
					res.writeHead(400);
					res.end(JSON.stringify({ error: "Invalid JSON body" }));
					return;
				}
			}
		}

		if (req.method === "POST" && req.url === "/scenario") {
			const { scenario, organizationId } = body as {
				scenario: ScenarioName;
				organizationId: string;
			};

			activateScenario(organizationId, scenario);

			res.writeHead(200);
			res.end(
				JSON.stringify({
					success: true,
					organizationId,
					scenario,
				}),
			);
			return;
		}

		if (req.method === "POST" && req.url === "/start") {
			const { organizationId } = body as {
				organizationId: string;
			};

			await startGenerator(organizationId);

			res.writeHead(200);
			res.end(
				JSON.stringify({
					success: true,
					organizationId,
					running: true,
				}),
			);
			return;
		}

		if (req.method === "POST" && req.url === "/stop") {
			const { organizationId } = body as {
				organizationId: string;
			};

			stopGenerator(organizationId);

			res.writeHead(200);
			res.end(
				JSON.stringify({
					success: true,
					organizationId,
					running: false,
				}),
			);
			return;
		}

		res.writeHead(404);
		res.end(JSON.stringify({ error: "Not Found" }));
	});

	server.listen(port, "0.0.0.0", () => {
		logger.info({ port }, "Simulator server listening");
	});
}
