import type { Alert, AlertSeverity } from "@ironveil/shared-types";
import { pool } from "../client.js";

interface AlertRow {
	id: string;
	organization_id: string;
	threat_id: string;
	message: string;
	severity: AlertSeverity;
	created_at: Date;
}

function toAlert(row: AlertRow): Alert {
	return {
		id: row.id,
		organizationId: row.organization_id,
		threatId: row.threat_id,
		message: row.message,
		severity: row.severity,
		createdAt: row.created_at.toISOString(),
	};
}

export async function listAlerts(
	organizationId: string,
	severity: AlertSeverity | undefined,
	page: number,
	limit: number,
) {
	const where = severity
		? "WHERE organization_id = $1 AND severity = $2"
		: "WHERE organization_id = $1";
	const params: unknown[] = severity
		? [organizationId, severity]
		: [organizationId];
	const offset = (page - 1) * limit;
	const limitParam = severity ? "$3" : "$2";
	const offsetParam = severity ? "$4" : "$3";

	const [rows, count] = await Promise.all([
		pool.query<AlertRow>(
			`SELECT * FROM alerts ${where} ORDER BY created_at DESC LIMIT ${limitParam} OFFSET ${offsetParam}`,
			[...params, limit, offset],
		),
		pool.query<{ count: string }>(
			`SELECT COUNT(*) as count FROM alerts ${where}`,
			params,
		),
	]);

	return {
		data: rows.rows.map(toAlert),
		total: parseInt(count.rows[0]?.count ?? "0", 10),
	};
}

export async function findAlertByThreatId(
	organizationId: string,
	threatId: string,
) {
	const result = await pool.query<AlertRow>(
		"SELECT * FROM alerts WHERE organization_id = $1 AND threat_id = $2",
		[organizationId, threatId],
	);
	const row = result.rows[0];
	return row ? toAlert(row) : null;
}
