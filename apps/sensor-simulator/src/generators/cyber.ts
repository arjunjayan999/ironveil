import type { SensorEvent } from "@ironveil/shared-types";
import { getMode } from "../scenarios/index.js";
import { randomInt } from "./utils.js";

const ATTACK_TYPES = [
	"PORT_SCAN",
	"BRUTE_FORCE",
	"SQL_INJECTION",
	"DDOS",
	"EXFILTRATION",
	"RANSOMWARE",
	"PHISHING",
	"ZERO_DAY_EXPLOIT",
] as const;

const SOURCE_IPS = [
	"198.51.100.42",
	"203.0.113.17",
	"192.0.2.88",
	"198.51.100.99",
	"10.0.0.254",
];

export async function generateCyberEvent(
	organizationId: string,
): Promise<SensorEvent> {
	const mode = getMode(organizationId);

	const attackTypes =
		mode === "cyber-attack"
			? (["RANSOMWARE", "ZERO_DAY_EXPLOIT", "EXFILTRATION", "DDOS"] as const)
			: ATTACK_TYPES;

	const attackType = attackTypes[randomInt(0, attackTypes.length - 1)];
	const sourceIp = SOURCE_IPS[randomInt(0, SOURCE_IPS.length - 1)];

	const isRepeatedEntry = mode === "cyber-attack" ? true : Math.random() < 0.3;

	return {
		id: crypto.randomUUID(),
		organizationId,
		sourceType: "cyber",
		sourceId: `CYBER-${sourceIp}`,
		latitude: 0,
		longitude: 0,
		altitudeMeters: 0,
		speedKnots: 0,
		heading: 0,
		inRestrictedZone: false,
		zoneId: null,
		identityConfirmed: false,
		isRepeatedEntry,
		payload: {
			attackType,
			sourceIp,
			targetSystem: `SYS-${randomInt(1, 20).toString().padStart(2, "0")}`,
			severity: mode === "cyber-attack" ? "CRITICAL" : "MEDIUM",
			packetsPerSecond: randomInt(100, 50_000),
		},
		createdAt: new Date().toISOString(),
	};
}
