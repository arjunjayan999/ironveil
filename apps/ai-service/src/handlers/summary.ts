import { logger } from "@ironveil/logger";
import type { SummaryRow } from "../db/queries/summaries.js";
import {
	findSummaryByThreatId,
	insertSummary,
} from "../db/queries/summaries.js";
import { getThreatContext } from "../db/queries/threats.js";
import type { AIProvider } from "../providers/interface.js";
import { upsertThreatVector } from "../qdrant/client.js";

function buildSummaryPrompt(
	ctx: NonNullable<Awaited<ReturnType<typeof getThreatContext>>>,
): string {
	const coords =
		ctx.latitude !== null && ctx.longitude !== null
			? `${ctx.latitude.toFixed(4)}°N, ${ctx.longitude.toFixed(4)}°E`
			: "coordinates unavailable (cyber event)";

	const altSpeed =
		ctx.altitudeMeters !== null
			? `Altitude: ${ctx.altitudeMeters}m | Speed: ${ctx.speedKnots ?? 0} knots`
			: "No altitude/speed data (cyber event)";

	const scoreLines = Object.entries(ctx.scoreBreakdown)
		.filter(([, v]) => v > 0)
		.map(([k, v]) => `  - ${k}: +${v}`)
		.join("\n");

	return `You are a defense intelligence analyst. Write a concise, factual intelligence \
summary using military brevity. Do not speculate. Do not use first person. Use present tense.

THREAT DATA:
  Threat ID:     ${ctx.threatId}
  Source:        ${ctx.sourceType.toUpperCase()} / ${ctx.sourceId}
  Location:      ${coords}
  ${altSpeed}
  Threat Score:  ${ctx.threatScore}/100 (${ctx.threatLevel})
  Status:        ${ctx.status}
  Timestamp:     ${ctx.createdAt.toISOString()}
  Zone Violated: ${ctx.inRestrictedZone ? `YES (Zone ID: ${ctx.zoneId ?? "unknown"})` : "NO"}
  Identity:      ${ctx.identityConfirmed ? "CONFIRMED" : "UNCONFIRMED"}

SCORE BREAKDOWN (contributing factors):
${scoreLines || "  No rules triggered (score: 0)"}

Write exactly 3–5 sentences covering:
1. What was detected and where
2. Why it scores ${ctx.threatLevel} (reference the specific factors above)
3. Recommended immediate action for the operations team`;
}

export async function generateOrGetSummary(
	threatId: string,
	provider: AIProvider,
	forceRegenerate = false,
): Promise<SummaryRow> {
	if (!forceRegenerate) {
		const cached = await findSummaryByThreatId(threatId);
		if (cached) {
			logger.debug({ threatId }, "Returning cached AI summary");
			return cached;
		}
	}

	logger.info({ threatId }, "Generating AI summary...");

	const ctx = await getThreatContext(threatId);
	if (!ctx) {
		throw new Error(`Threat ${threatId} not found or has no associated event`);
	}

	const prompt = buildSummaryPrompt(ctx);
	const summaryText = await provider.generateSummary(prompt);

	const summary = await insertSummary(
		threatId,
		summaryText,
		provider.modelName,
	);

	logger.info({ threatId, modelName: provider.modelName }, "AI summary stored");
	try {
		const embedding = await provider.generateEmbedding(summaryText);
		await upsertThreatVector(threatId, embedding, {
			threatId,
			threatLevel: ctx.threatLevel,
			threatScore: ctx.threatScore,
			sourceType: ctx.sourceType,
			sourceId: ctx.sourceId,
			createdAt: ctx.createdAt.toISOString(),
			summaryPreview: summaryText.slice(0, 200),
		});
		logger.info({ threatId }, "Threat vector upserted to Qdrant");
	} catch (err) {
		logger.error(
			{ err, threatId },
			"Failed to upsert vector to Qdrant - summary still saved",
		);
	}

	return summary;
}
