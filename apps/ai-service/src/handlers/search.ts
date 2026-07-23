import { logger } from "@ironveil/logger";
import type { AIProvider } from "../providers/interface.js";
import type { SearchResult } from "../qdrant/client.js";
import { searchSimilar } from "../qdrant/client.js";

export async function semanticSearch(
	query: string,
	provider: AIProvider,
	limit = 10,
): Promise<SearchResult[]> {
	if (!query.trim()) throw new Error("Query cannot be empty");
	if (query.length > 500) throw new Error("Query too long (max 500 chars)");

	logger.info({ query, limit }, "Running semantic search");

	const queryVector = await provider.generateEmbedding(query);
	const results = await searchSimilar(queryVector, limit);

	logger.info({ resultCount: results.length }, "Semantic search complete");
	return results;
}

export async function findSimilarThreats(
	threatId: string,
	summaryText: string,
	provider: AIProvider,
	limit = 5,
): Promise<SearchResult[]> {
	logger.info({ threatId, limit }, "Finding similar threats");

	const vector = await provider.generateEmbedding(summaryText);
	const results = await searchSimilar(vector, limit, threatId);

	return results;
}
