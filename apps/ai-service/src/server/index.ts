import {
	createServer,
	type IncomingMessage,
	type ServerResponse,
} from "node:http";
import { logger } from "@ironveil/logger";
import { findSummaryByThreatId } from "../db/queries/summaries.js";
import { generateIncidentReport } from "../handlers/report.js";
import { findSimilarThreats, semanticSearch } from "../handlers/search.js";
import { generateOrGetSummary } from "../handlers/summary.js";
import type { AIProvider } from "../providers/interface.js";

async function readBody(req: IncomingMessage): Promise<unknown> {
	const chunks: Buffer[] = [];
	for await (const chunk of req) chunks.push(chunk as Buffer);
	return JSON.parse(Buffer.concat(chunks).toString());
}

function send(res: ServerResponse, status: number, data: unknown): void {
	const body = JSON.stringify(data);
	res.writeHead(status, {
		"Content-Type": "application/json",
		"Content-Length": Buffer.byteLength(body),
	});
	res.end(body);
}

function sendError(res: ServerResponse, status: number, message: string): void {
	send(res, status, { error: message });
}

export function startServer(port: number, provider: AIProvider): void {
	const server = createServer(async (req, res) => {
		const url = req.url ?? "/";
		const method = req.method ?? "GET";

		try {
			if (method === "GET" && url === "/healthz") {
				send(res, 200, {
					status: "ok",
					uptime: process.uptime(),
					provider: provider.modelName,
				});
				return;
			}
			if (method === "POST" && url === "/internal/summary") {
				const body = (await readBody(req)) as {
					threatId?: string;
					force?: boolean;
				};
				if (!body.threatId) return sendError(res, 400, "threatId is required");

				const summary = await generateOrGetSummary(
					body.threatId,
					provider,
					body.force ?? false,
				);
				send(res, 200, { data: summary });
				return;
			}

			if (method === "POST" && url === "/internal/report") {
				const body = (await readBody(req)) as { threatIds?: string[] };
				if (!Array.isArray(body.threatIds) || body.threatIds.length === 0) {
					return sendError(res, 400, "threatIds must be a non-empty array");
				}

				const report = await generateIncidentReport(body.threatIds, provider);
				send(res, 200, { data: { report } });
				return;
			}

			if (method === "POST" && url === "/internal/search") {
				const body = (await readBody(req)) as {
					query?: string;
					limit?: number;
				};
				if (!body.query) return sendError(res, 400, "query is required");

				const results = await semanticSearch(
					body.query,
					provider,
					body.limit ?? 10,
				);
				send(res, 200, { data: results });
				return;
			}

			const similarMatch = url.match(/^\/internal\/similar\/(.+)$/);
			if (method === "GET" && similarMatch) {
				const threatId = similarMatch[1];
				if (!threatId) {
					return sendError(res, 400, "Invalid threatId");
				}

				const existing = await findSummaryByThreatId(threatId);
				if (!existing) {
					return sendError(
						res,
						404,
						`No summary found for threat ${threatId}. Generate one first.`,
					);
				}

				const results = await findSimilarThreats(
					threatId,
					existing.summary,
					provider,
					5,
				);
				send(res, 200, { data: results });
				return;
			}

			sendError(res, 404, "Not found");
		} catch (err) {
			logger.error({ err, url, method }, "AI Service request error");
			sendError(
				res,
				500,
				err instanceof Error ? err.message : "Internal error",
			);
		}
	});

	server.listen(port, "0.0.0.0", () => {
		logger.info({ port }, "AI Service internal server listening");
	});
}
