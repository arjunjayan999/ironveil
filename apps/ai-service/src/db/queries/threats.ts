import { pool } from "../client.js";

export interface ThreatContext {
	threatId: string;
	threatScore: number;
	threatLevel: string;
	status: string;
	scoreBreakdown: Record<string, number>;
	createdAt: Date;
	sourceType: string;
	sourceId: string;
	latitude: number | null;
	longitude: number | null;
	altitudeMeters: number | null;
	speedKnots: number | null;
	inRestrictedZone: boolean;
	zoneId: string | null;
	identityConfirmed: boolean;
}

export async function getThreatContext(
	threatId: string,
): Promise<ThreatContext | null> {
	const result = await pool.query<{
		threat_id: string;
		threat_score: number;
		threat_level: string;
		status: string;
		score_breakdown: Record<string, number>;
		created_at: Date;
		source_type: string;
		source_id: string;
		latitude: number | null;
		longitude: number | null;
		altitude: number | null;
		speed: number | null;
		payload: {
			inRestrictedZone?: boolean;
			zoneId?: string | null;
			identityConfirmed?: boolean;
		};
	}>(
		`SELECT
       t.id AS threat_id,
       t.threat_score,
       t.threat_level,
       t.status,
       t.score_breakdown,
       t.created_at,
       e.source_type,
       e.source_id,
       e.latitude,
       e.longitude,
       e.altitude,
       e.speed,
       e.payload
     FROM threats t
     JOIN events e ON e.id = t.event_id
     WHERE t.id = $1`,
		[threatId],
	);

	const row = result.rows[0];
	if (!row) return null;

	return {
		threatId: row.threat_id,
		threatScore: row.threat_score,
		threatLevel: row.threat_level,
		status: row.status,
		scoreBreakdown: row.score_breakdown,
		createdAt: row.created_at,
		sourceType: row.source_type,
		sourceId: row.source_id,
		latitude: row.latitude,
		longitude: row.longitude,
		altitudeMeters: row.altitude,
		speedKnots: row.speed,
		inRestrictedZone: row.payload?.inRestrictedZone ?? false,
		zoneId: row.payload?.zoneId ?? null,
		identityConfirmed: row.payload?.identityConfirmed ?? true,
	};
}
