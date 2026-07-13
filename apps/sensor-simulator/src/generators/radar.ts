import type { SensorEvent } from "@ironveil/shared-types";
import { config } from "../config.js";
import { findZoneAtPoint, getZones } from "../db/queries/zones.js";
import { randomFloat, randomInt } from "./utils.js";

export async function generateRadarEvent(
	organizationId: string,
): Promise<SensorEvent> {
	const zones = await getZones(organizationId);
	const latitude = config.centerLat + randomFloat(-3, 3);
	const longitude = config.centerLon + randomFloat(-3, 3);

	const zone = findZoneAtPoint(latitude, longitude, zones);

	return {
		id: crypto.randomUUID(),
		organizationId,
		sourceType: "radar",
		sourceId: `RADAR-CONTACT-${randomInt(100, 999)}`,
		latitude,
		longitude,
		altitudeMeters: randomInt(500, 8000),
		speedKnots: randomInt(50, 180),
		heading: randomInt(0, 359),
		inRestrictedZone: zone !== null,
		zoneId: zone?.id ?? null,
		identityConfirmed: Math.random() > 0.4,
		isRepeatedEntry: Math.random() < 0.1,
		payload: { radarSignatureStrength: randomFloat(0.1, 1.0).toFixed(2) },
		createdAt: new Date().toISOString(),
	};
}
