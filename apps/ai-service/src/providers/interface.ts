export interface AIProvider {
	generateSummary(prompt: string): Promise<string>;
	generateEmbedding(text: string): Promise<number[]>;
	readonly modelName: string;
	readonly embeddingDimension: number;
}
