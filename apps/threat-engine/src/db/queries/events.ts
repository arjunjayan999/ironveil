import type { SensorEvent } from "@ironveil/shared-types";
import { pool } from "../client.js";

export async function insertEvent(event: SensorEvent): Promise<string> {
	const result = await pool.query<{ id: string }>(
		"INSERT INTO events (organization_id, source_type, source_id, latitude, longitude, altitude, speed, heading, payload) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id",
		[
			event.organizationId,
			event.sourceType,
			event.sourceId,
			event.latitude,
			event.longitude,
			event.altitudeMeters,
			event.speedKnots,
			event.heading,
			JSON.stringify(event.payload),
		],
	);
	const row = result.rows[0];

	if (!row) {
		throw new Error("INSERT RETURNING did not return a row");
	}

	return row.id;
}
