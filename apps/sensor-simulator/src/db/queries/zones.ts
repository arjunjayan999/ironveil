import { logger } from "@ironveil/logger";
import { distanceKm } from "../../generators/utils.js";
import { pool } from "../client.js";

interface Zone {
	id: string;
	organizationId: string;
	name: string;
	latitude: number;
	longitude: number;
	radiusKm: number;
}

const zoneCache = new Map<string, Zone[]>();
const lastRefreshMap = new Map<string, number>();
const REFRESH_INTERVAL_MS = 60_000;

async function fetchZones(organizationId: string): Promise<Zone[]> {
	const result = await pool.query<{
		id: string;
		organization_id: string;
		name: string;
		latitude: number;
		longitude: number;
		radius_km: number;
	}>(
		"SELECT id, organization_id, name, latitude, longitude, radius_km FROM restricted_zones WHERE organization_id = $1",
		[organizationId],
	);

	return result.rows.map((r) => ({
		id: r.id,
		organizationId: r.organization_id,
		name: r.name,
		latitude: r.latitude,
		longitude: r.longitude,
		radiusKm: r.radius_km,
	}));
}

export async function initZones(organizationId: string): Promise<void> {
	zoneCache.set(organizationId, await fetchZones(organizationId));
	lastRefreshMap.set(organizationId, Date.now());
	logger.info(
		{ count: zoneCache.get(organizationId)?.length },
		"Restricted zones loaded",
	);
}

export async function getZones(organizationId: string): Promise<Zone[]> {
	const lastRefresh = lastRefreshMap.get(organizationId) || 0;
	if (Date.now() - lastRefresh > REFRESH_INTERVAL_MS) {
		try {
			zoneCache.set(organizationId, await fetchZones(organizationId));
			lastRefreshMap.set(organizationId, Date.now());
			logger.debug(
				{ count: zoneCache.get(organizationId)?.length },
				"Zones refreshed",
			);
		} catch (err) {
			logger.warn({ err }, "Failed to refresh zones, using cached data");
		}
	}
	return zoneCache.get(organizationId) || [];
}

export function findZoneAtPoint(
	lat: number,
	lon: number,
	zones: Zone[],
): Zone | null {
	for (const zone of zones) {
		const dist = distanceKm(lat, lon, zone.latitude, zone.longitude);
		if (dist <= zone.radiusKm) {
			return zone;
		}
	}
	return null;
}

export function clearZoneCache(organizationId: string) {
	zoneCache.delete(organizationId);
	lastRefreshMap.delete(organizationId);
}
