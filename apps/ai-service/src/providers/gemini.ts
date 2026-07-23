import { GoogleGenAI } from "@google/genai";
import { logger } from "@ironveil/logger";
import { config } from "../config.js";
import type { AIProvider } from "./interface.js";

export class GeminiProvider implements AIProvider {
	private readonly client: GoogleGenAI;

	readonly modelName: string;
	readonly embeddingDimension = 768;

	constructor() {
		if (!config.geminiApiKey) {
			throw new Error(
				"GEMINI_API_KEY is required when AI_PROVIDER=gemini. " +
					"Get a key from https://aistudio.google.com/app/apikey",
			);
		}

		this.client = new GoogleGenAI({
			apiKey: config.geminiApiKey,
		});

		this.modelName = config.geminiSummaryModel;
	}

	async generateSummary(prompt: string): Promise<string> {
		const startMs = Date.now();

		const response = await this.client.models.generateContent({
			model: config.geminiSummaryModel,
			contents: prompt,
		});

		const durationMs = Date.now() - startMs;

		logger.info(
			{
				durationMs,
				model: config.geminiSummaryModel,
			},
			"Gemini summary generated",
		);

		const text = response.text;

		if (!text) {
			throw new Error("Gemini returned an empty response");
		}

		return text.trim();
	}

	async generateEmbedding(text: string): Promise<number[]> {
		const response = await this.client.models.embedContent({
			model: config.geminiEmbeddingModel,
			contents: text,
		});

		const embedding = response.embeddings?.[0]?.values;

		if (!embedding) {
			throw new Error("Gemini returned no embedding");
		}

		return embedding;
	}
}
