import { logger } from "@ironveil/logger";
import { getThreatContext } from "../db/queries/threats.js";
import type { AIProvider } from "../providers/interface.js";

export async function generateIncidentReport(
	threatIds: string[],
	provider: AIProvider,
): Promise<string> {
	if (threatIds.length === 0) {
		throw new Error("At least one threat ID is required for a report");
	}
	if (threatIds.length > 20) {
		throw new Error("Maximum 20 threats per report");
	}

	logger.info(
		{ threatIds, count: threatIds.length },
		"Generating incident report",
	);

	const contexts = await Promise.all(
		threatIds.map((id) => getThreatContext(id)),
	);

	const validContexts = contexts.filter(Boolean) as NonNullable<
		Awaited<ReturnType<typeof getThreatContext>>
	>[];

	if (validContexts.length === 0) {
		throw new Error("None of the provided threat IDs were found");
	}

	const firstContext = validContexts[0];
	const lastContext = validContexts[validContexts.length - 1];

	if (!firstContext || !lastContext) {
		throw new Error("Unexpected empty context list");
	}

	const threatSummaries = validContexts
		.map(
			(ctx, i) =>
				`[${i + 1}] ${ctx.sourceType.toUpperCase()} ${ctx.sourceId} - Score ${ctx.threatScore} (${ctx.threatLevel}) - Zone: ${ctx.inRestrictedZone ? "YES" : "NO"} - Identity: ${ctx.identityConfirmed ? "CONFIRMED" : "UNCONFIRMED"}`,
		)
		.join("\n");

	const highCount = validContexts.filter(
		(c) => c.threatLevel === "HIGH",
	).length;
	const medCount = validContexts.filter(
		(c) => c.threatLevel === "MEDIUM",
	).length;

	const prompt = `You are a senior defense intelligence analyst writing an incident report.
Use a professional, concise military reporting style.

INCIDENT DATA (${validContexts.length} threats):
${threatSummaries}

Summary statistics:
  HIGH threats:   ${highCount}
  MEDIUM threats: ${medCount}
  LOW threats:    ${validContexts.length - highCount - medCount}
  Time range:     ${firstContext.createdAt.toISOString()} to ${lastContext.createdAt.toISOString()}

Write a structured incident report in Markdown with these sections:
1. **Executive Summary** (2-3 sentences - overall assessment)
2. **Key Findings** (bullet list of the most significant events)
3. **Threat Pattern Analysis** (1-2 paragraphs - patterns, correlations, likely intent)
4. **Recommended Actions** (numbered list of immediate and follow-up actions)

Keep the report under 400 words.`;

	const report = await provider.generateSummary(prompt);
	logger.info({ count: validContexts.length }, "Incident report generated");

	return report;
}
