import type { AlertSeverity } from "@ironveil/shared-types";
import { pool } from "../client.js";

export async function insertAlert(
	organizationId: string,
	threatId: string,
	message: string,
	severity: AlertSeverity,
): Promise<string> {
	const result = await pool.query<{ id: string }>(
		"INSERT INTO alerts (organization_id, threat_id, message, severity) VALUES ($1, $2, $3, $4) RETURNING id",
		[organizationId, threatId, message, severity],
	);
	const row = result.rows[0];
	if (!row) {
		throw new Error("INSERT RETURNING did not return a row");
	}
	return row.id;
}
