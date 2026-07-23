import { logger } from "@ironveil/logger";
import { config } from "../config.js";
import type { AIProvider } from "./interface.js";

export class OllamaProvider implements AIProvider {
	readonly modelName: string;
	readonly embeddingDimension = 768;

	constructor() {
		this.modelName = config.ollamaSummaryModel;
	}

	async generateSummary(prompt: string): Promise<string> {
		const startMs = Date.now();

		const response = await fetch(`${config.ollamaBaseUrl}/api/generate`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				model: config.ollamaSummaryModel,
				prompt,
				stream: false,
				options: { temperature: 0.3, num_predict: 300 },
			}),
		});

		if (!response.ok) {
			throw new Error(
				`Ollama error: ${response.status} ${response.statusText}`,
			);
		}

		const data = (await response.json()) as { response: string };
		const durationMs = Date.now() - startMs;
		logger.info(
			{ durationMs, model: config.ollamaSummaryModel },
			"Ollama summary generated",
		);

		return data.response.trim();
	}

	async generateEmbedding(text: string): Promise<number[]> {
		const response = await fetch(`${config.ollamaBaseUrl}/api/embeddings`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				model: config.ollamaEmbeddingModel,
				prompt: text,
			}),
		});

		if (!response.ok) {
			throw new Error(`Ollama embedding error: ${response.status}`);
		}

		const data = (await response.json()) as { embedding: number[] };
		return data.embedding;
	}
}
