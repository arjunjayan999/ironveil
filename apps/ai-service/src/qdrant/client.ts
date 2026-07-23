import { logger } from "@ironveil/logger";
import { config } from "../config.js";

const BASE = config.qdrantUrl;
const COLLECTION = config.qdrantCollection;

export interface ThreatVectorPayload {
	threatId: string;
	threatLevel: string;
	threatScore: number;
	sourceType: string;
	sourceId: string;
	createdAt: string;
	summaryPreview: string;
}

export async function ensureCollection(vectorSize: number): Promise<void> {
	const check = await fetch(`${BASE}/collections/${COLLECTION}`);

	if (check.status === 200) {
		logger.info({ collection: COLLECTION }, "Qdrant collection already exists");
		return;
	}

	const create = await fetch(`${BASE}/collections/${COLLECTION}`, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			vectors: {
				size: vectorSize,
				distance: "Cosine",
			},
		}),
	});

	if (!create.ok) {
		const body = await create.text();
		throw new Error(`Failed to create Qdrant collection: ${body}`);
	}

	logger.info(
		{ collection: COLLECTION, vectorSize },
		"Qdrant collection created",
	);
}

export async function upsertThreatVector(
	threatId: string,
	vector: number[],
	payload: ThreatVectorPayload,
): Promise<void> {
	const response = await fetch(`${BASE}/collections/${COLLECTION}/points`, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			points: [
				{
					id: threatId,
					vector,
					payload,
				},
			],
		}),
	});

	if (!response.ok) {
		const body = await response.text();
		throw new Error(`Failed to upsert vector to Qdrant: ${body}`);
	}
}

export interface SearchResult {
	threatId: string;
	score: number;
	payload: ThreatVectorPayload;
}

export async function searchSimilar(
	queryVector: number[],
	limit = 5,
	excludeThreatId?: string,
): Promise<SearchResult[]> {
	const response = await fetch(
		`${BASE}/collections/${COLLECTION}/points/search`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				vector: queryVector,
				limit: excludeThreatId ? limit + 1 : limit,
				with_payload: true,
			}),
		},
	);

	if (!response.ok) {
		const body = await response.text();
		throw new Error(`Qdrant search failed: ${body}`);
	}

	const data = (await response.json()) as {
		result: Array<{
			id: string;
			score: number;
			payload: ThreatVectorPayload;
		}>;
	};

	return data.result
		.filter((r) => r.id !== excludeThreatId)
		.slice(0, limit)
		.map((r) => ({
			threatId: r.id,
			score: r.score,
			payload: r.payload,
		}));
}
