import { pool } from "../client.js";

export interface SummaryRow {
	id: string;
	threatId: string;
	summary: string;
	modelName: string;
	generatedAt: Date;
}

export async function findSummaryByThreatId(
	threatId: string,
): Promise<SummaryRow | null> {
	const result = await pool.query<{
		id: string;
		threat_id: string;
		summary: string;
		model_name: string;
		generated_at: Date;
	}>("SELECT * FROM ai_summaries WHERE threat_id = $1", [threatId]);

	const row = result.rows[0];
	if (!row) return null;

	return {
		id: row.id,
		threatId: row.threat_id,
		summary: row.summary,
		modelName: row.model_name,
		generatedAt: row.generated_at,
	};
}

export async function insertSummary(
	threatId: string,
	summary: string,
	modelName: string,
): Promise<SummaryRow> {
	const result = await pool.query<{
		id: string;
		threat_id: string;
		summary: string;
		model_name: string;
		generated_at: Date;
	}>(
		`INSERT INTO ai_summaries (threat_id, summary, model_name)
     VALUES ($1, $2, $3)
     ON CONFLICT (threat_id) DO UPDATE
       SET summary = EXCLUDED.summary,
           model_name = EXCLUDED.model_name,
           generated_at = NOW()
     RETURNING *`,
		[threatId, summary, modelName],
	);

	const row = result.rows[0];

	if (!row) {
		throw new Error("Failed to insert summary");
	}

	return {
		id: row.id,
		threatId: row.threat_id,
		summary: row.summary,
		modelName: row.model_name,
		generatedAt: row.generated_at,
	};
}
