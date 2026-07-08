import type {
	ScoreBreakdown,
	SensorEvent,
	ThreatLevel,
} from "@ironveil/shared-types";

const POINTS = {
	RESTRICTED_ZONE_ENTRY: 40,
	UNKNOWN_IDENTITY: 20,
	HIGH_SPEED: 15,
	HIGH_ALTITUDE: 10,
	REPEATED_ENTRY: 15,
} as const;

const HIGH_SPEED_THRESHOLD_KNOTS = 150;

const HIGH_ALTITUDE_THRESHOLD_METERS = 10_000;

export interface ScoringResult {
	threatScore: number;
	threatLevel: ThreatLevel;
	scoreBreakdown: ScoreBreakdown;
}

export function scoreEvent(event: SensorEvent): ScoringResult {
	const breakdown: ScoreBreakdown = {
		restrictedZoneEntry: 0,
		unknownIdentity: 0,
		highSpeed: 0,
		highAltitude: 0,
		repeatedEntry: 0,
	};

	if (event.inRestrictedZone) {
		breakdown.restrictedZoneEntry = POINTS.RESTRICTED_ZONE_ENTRY;
	}

	if (!event.identityConfirmed) {
		breakdown.unknownIdentity = POINTS.UNKNOWN_IDENTITY;
	}

	if (event.speedKnots > HIGH_SPEED_THRESHOLD_KNOTS) {
		breakdown.highSpeed = POINTS.HIGH_SPEED;
	}

	if (event.altitudeMeters > HIGH_ALTITUDE_THRESHOLD_METERS) {
		breakdown.highAltitude = POINTS.HIGH_ALTITUDE;
	}

	if (event.isRepeatedEntry) {
		breakdown.repeatedEntry = POINTS.REPEATED_ENTRY;
	}

	const raw =
		breakdown.restrictedZoneEntry +
		breakdown.unknownIdentity +
		breakdown.highSpeed +
		breakdown.highAltitude +
		breakdown.repeatedEntry;

	const threatScore = Math.min(100, Math.max(0, raw));
	const threatLevel = getThreatLevel(threatScore);

	return {
		threatScore,
		threatLevel,
		scoreBreakdown: breakdown,
	};
}

export function getThreatLevel(score: number): ThreatLevel {
	if (score >= 71) return "HIGH";
	if (score >= 31) return "MEDIUM";
	return "LOW";
}

export function buildAlertMessage(event: SensorEvent, score: number): string {
	const parts: string[] = [
		`HIGH THREAT DETECTED: ${event.sourceType.toUpperCase()} ${event.sourceId}`,
		`Score: ${score}/100`,
	];
	if (event.inRestrictedZone) {
		parts.push(
			`Zone violation: entered restricted zone ${event.zoneId ?? "unknown"}`,
		);
	}
	if (!event.identityConfirmed) {
		parts.push("Identity: UNCONFIRMED");
	}
	if (event.speedKnots > HIGH_SPEED_THRESHOLD_KNOTS) {
		parts.push(
			`Speed: ${event.speedKnots} knots (exceeds ${HIGH_SPEED_THRESHOLD_KNOTS})`,
		);
	}
	if (event.altitudeMeters > HIGH_ALTITUDE_THRESHOLD_METERS) {
		parts.push(
			`Altitude: ${event.altitudeMeters}m (exceeds ${HIGH_ALTITUDE_THRESHOLD_METERS}m)`,
		);
	}
	return parts.join(" | ");
}
