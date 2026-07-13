import type { SensorEvent } from "@ironveil/shared-types";
import { config } from "../config.js";
import { findZoneAtPoint, getZones } from "../db/queries/zones.js";
import { getMode } from "../scenarios/index.js";
import { clamp, movePoint, randomFloat, randomInt } from "./utils.js";

interface DroneState {
	droneId: string;
	latitude: number;
	longitude: number;
	altitudeMeters: number;
	speedKnots: number;
	heading: number;
	zoneEntryCount: number;
	currentlyInsideZone: boolean;
}

const fleets = new Map<string, Map<string, DroneState>>();

const CRUISE_SPEED_MIN = 40;
const CRUISE_SPEED_MAX = 120;

const KM_PER_TICK = 0.1;

export function initFleet(organizationId: string): void {
	const fleet = new Map<string, DroneState>();
	fleets.set(organizationId, fleet);
	for (let i = 1; i <= config.fleetSize; i++) {
		const droneId = `DRONE-${String(i).padStart(3, "0")}`;

		const lat = config.centerLat + randomFloat(-1.5, 1.5);
		const lon = config.centerLon + randomFloat(-2.0, 2.0);

		fleet.set(droneId, {
			droneId,
			latitude: lat,
			longitude: lon,
			altitudeMeters: randomInt(200, 5000),
			speedKnots: randomInt(CRUISE_SPEED_MIN, CRUISE_SPEED_MAX),
			heading: randomInt(0, 359),
			zoneEntryCount: 0,
			currentlyInsideZone: false,
		});
	}
}

function advanceDrone(state: DroneState): DroneState {
	const headingDelta = randomFloat(-15, 15);
	const newHeading = (state.heading + headingDelta + 360) % 360;

	const { lat, lon } = movePoint(
		state.latitude,
		state.longitude,
		newHeading,
		KM_PER_TICK,
	);

	return {
		...state,
		latitude: lat,
		longitude: lon,
		heading: newHeading,
		altitudeMeters: clamp(
			state.altitudeMeters + randomFloat(-150, 150),
			50,
			15_000,
		),
		speedKnots: clamp(state.speedKnots + randomFloat(-5, 5), 10, 250),
	};
}

export async function generateDroneEvent(
	organizationId: string,
): Promise<SensorEvent> {
	const zones = await getZones(organizationId);
	const mode = getMode(organizationId);
	const fleet = fleets.get(organizationId);

	if (!fleet) {
		throw new Error(`Fleet not initialized for organization ${organizationId}`);
	}

	const droneIds = [...fleet.keys()];
	const droneId = droneIds[randomInt(0, droneIds.length - 1)];
	if (!droneId) {
		throw new Error("No available drone found");
	}
	let state = fleet.get(droneId);
	if (!state) {
		throw new Error(`No state found for drone ${droneId}`);
	}
	state = advanceDrone(state);

	if (mode === "mass-incursion" && zones.length > 0 && Math.random() < 0.8) {
		const zone = zones[randomInt(0, zones.length - 1)];
		if (!zone) {
			throw new Error("No zone found for mass-incursion");
		}
		const offsetKm = zone.radiusKm * 0.8;
		const { lat, lon } = movePoint(
			zone.latitude,
			zone.longitude,
			randomInt(0, 359),
			offsetKm,
		);
		state = { ...state, latitude: lat, longitude: lon };
	}

	const zone = findZoneAtPoint(state.latitude, state.longitude, zones);
	const inRestrictedZone = zone !== null;

	if (inRestrictedZone && !state.currentlyInsideZone) {
		state = {
			...state,
			zoneEntryCount: state.zoneEntryCount + 1,
			currentlyInsideZone: true,
		};
	} else if (!inRestrictedZone && state.currentlyInsideZone) {
		state = { ...state, currentlyInsideZone: false };
	}

	fleet.set(droneId, state);

	const identityConfirmed =
		mode === "mass-incursion" ? Math.random() < 0.2 : Math.random() < 0.75;

	const isRepeatedEntry = state.zoneEntryCount > 1;

	return {
		id: crypto.randomUUID(),
		organizationId,
		sourceType: "drone",
		sourceId: droneId,
		latitude: state.latitude,
		longitude: state.longitude,
		altitudeMeters: state.altitudeMeters,
		speedKnots: state.speedKnots,
		heading: state.heading,
		inRestrictedZone,
		zoneId: zone?.id ?? null,
		identityConfirmed,
		isRepeatedEntry,
		payload: { zoneEntryCount: state.zoneEntryCount },
		createdAt: new Date().toISOString(),
	};
}

export function destroyFleet(organizationId: string) {
	fleets.delete(organizationId);
}
