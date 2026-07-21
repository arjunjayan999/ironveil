import type {
	ScoreBreakdown,
	ThreatLevel,
	ThreatStatus,
} from "@ironveil/shared-types";
import { pool } from "../client.js";

export interface InsertThreatParams {
	organizationId: string;
	eventId: string;
	threatScore: number;
	threatLevel: ThreatLevel;
	status: ThreatStatus;
	scoreBreakdown: ScoreBreakdown;
}

export async function insertThreat(
	params: InsertThreatParams,
): Promise<string> {
	const result = await pool.query<{ id: string }>(
		`INSERT INTO threats (
		organization_id,
		event_id,
		threat_score,
		threat_level,
		status,
		score_breakdown
	) VALUES ($1, $2, $3, $4, $5, $6)
	RETURNING id`,
		[
			params.organizationId,
			params.eventId,
			params.threatScore,
			params.threatLevel,
			params.status,
			JSON.stringify(params.scoreBreakdown),
		],
	);
	const row = result.rows[0];

	if (!row) {
		throw new Error("INSERT RETURNING did not return a row");
	}

	return row.id;
}
