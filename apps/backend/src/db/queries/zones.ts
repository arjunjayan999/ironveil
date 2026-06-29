import type { RestrictedZone } from "@ironveil/shared-types";
import { pool } from "../client.js";

interface ZoneRow {
	id: string;
	organization_id: string;
	name: string;
	latitude: number;
	longitude: number;
	radius_km: number;
	created_at: Date;
}

function toZone(row: ZoneRow): RestrictedZone {
	return {
		id: row.id,
		organizationId: row.organization_id,
		name: row.name,
		latitude: row.latitude,
		longitude: row.longitude,
		radiusKm: row.radius_km,
		createdAt: row.created_at.toISOString(),
	};
}

export async function listZones(
	organizationId: string,
): Promise<RestrictedZone[]> {
	const result = await pool.query<ZoneRow>(
		"SELECT * FROM restricted_zones WHERE organization_id = $1 ORDER BY name ASC",
		[organizationId],
	);
	return result.rows.map(toZone);
}

export async function createZone(
	organizationId: string,
	name: string,
	latitude: number,
	longitude: number,
	radiusKm: number,
): Promise<RestrictedZone> {
	const result = await pool.query<ZoneRow>(
		"INSERT INTO restricted_zones (organization_id, name, latitude, longitude, radius_km) VALUES ($1, $2, $3, $4, $5) RETURNING *",
		[organizationId, name, latitude, longitude, radiusKm],
	);
	const row = result.rows[0];
	if (!row) {
		throw new Error("Failed to create restricted zone");
	}
	return toZone(row);
}

export async function deleteZone(
	id: string,
	organizationId: string,
): Promise<boolean> {
	const result = await pool.query(
		"DELETE FROM restricted_zones WHERE id = $1 AND organization_id = $2",
		[id, organizationId],
	);
	return (result.rowCount ?? 0) > 0;
}
