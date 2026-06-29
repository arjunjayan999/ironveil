import type {
	ScoreBreakdown,
	Threat,
	ThreatLevel,
	ThreatStatus,
} from "@ironveil/shared-types";
import { pool } from "../client.js";

interface ThreatRow {
	id: string;
	organization_id: string;
	event_id: string;
	threat_score: number;
	threat_level: ThreatLevel;
	status: ThreatStatus;
	score_breakdown: ScoreBreakdown;
	created_at: Date;
}

function toThreat(row: ThreatRow): Threat {
	return {
		id: row.id,
		organizationId: row.organization_id,
		eventId: row.event_id,
		threatScore: row.threat_score,
		threatLevel: row.threat_level,
		status: row.status,
		scoreBreakdown: row.score_breakdown,
		createdAt: row.created_at.toISOString(),
	};
}

export interface ListThreatsFilter {
	organizationId: string;
	level?: ThreatLevel;
	status?: ThreatStatus;
	page: number;
	limit: number;
}

export async function listThreats(filter: ListThreatsFilter) {
	const conditions: string[] = ["organization_id = $1"];
	const params: unknown[] = [filter.organizationId];
	let paramIndex = 2;

	if (filter.level) {
		conditions.push(`threat_level = $${paramIndex++}`);
		params.push(filter.level);
	}
	if (filter.status) {
		conditions.push(`status = $${paramIndex++}`);
		params.push(filter.status);
	}

	const where = `WHERE ${conditions.join(" AND ")}`;
	const offset = (filter.page - 1) * filter.limit;

	const [rows, count] = await Promise.all([
		pool.query<ThreatRow>(
			`SELECT * FROM threats ${where} ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
			[...params, filter.limit, offset],
		),
		pool.query<{ count: string }>(
			`SELECT COUNT(*) FROM threats ${where}`,
			params,
		),
	]);

	return {
		data: rows.rows.map(toThreat),
		total: parseInt(count.rows[0]?.count ?? "0", 10),
	};
}

export async function findThreatById(
	organizationId: string,
	id: string,
): Promise<Threat | null> {
	const result = await pool.query<ThreatRow>(
		"SELECT * FROM threats WHERE organization_id = $1 AND id = $2",
		[organizationId, id],
	);
	const row = result.rows[0];
	return row ? toThreat(row) : null;
}

export async function updateThreatStatus(
	organizationId: string,
	id: string,
	status: ThreatStatus,
): Promise<Threat | null> {
	const result = await pool.query<ThreatRow>(
		"UPDATE threats SET status = $1 WHERE organization_id = $2 AND id = $3 RETURNING *",
		[status, organizationId, id],
	);
	const row = result.rows[0];
	return row ? toThreat(row) : null;
}
