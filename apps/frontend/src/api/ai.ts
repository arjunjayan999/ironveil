import { apiRequest } from "./client.js";

export interface AiSummaryResponse {
	data: {
		id: string;
		threatId: string;
		summary: string;
		modelName: string;
		generatedAt: string;
	};
}

export interface SimilarThreat {
	threatId: string;
	score: number;
	payload: {
		threatLevel: string;
		threatScore: number;
		sourceType: string;
		sourceId: string;
		summaryPreview: string;
	};
}

export async function requestSummary(
	threatId: string,
	force = false,
): Promise<AiSummaryResponse["data"]> {
	const result = await apiRequest<AiSummaryResponse>("/api/v1/ai/summary", {
		method: "POST",
		body: JSON.stringify({ threatId, force }),
	});
	return result.data;
}

export async function searchThreats(query: string): Promise<SimilarThreat[]> {
	const result = await apiRequest<{ data: SimilarThreat[] }>(
		"/api/v1/ai/search",
		{
			method: "POST",
			body: JSON.stringify({ query }),
		},
	);
	return result.data;
}

export async function getSimilarThreats(
	threatId: string,
): Promise<SimilarThreat[]> {
	const result = await apiRequest<{ data: SimilarThreat[] }>(
		`/api/v1/ai/similar/${threatId}`,
	);
	return result.data;
}
