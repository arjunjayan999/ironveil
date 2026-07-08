import type { SensorEvent } from "@ironveil/shared-types";
import { describe, expect, it } from "vitest";
import { buildAlertMessage, getThreatLevel, scoreEvent } from "./engine.js";

const safeEvent: SensorEvent = {
	id: "test-id-1",
	organizationId: "org-1",
	sourceType: "drone",
	sourceId: "DRONE-001",
	latitude: 51.5,
	longitude: -0.1,
	altitudeMeters: 500,
	speedKnots: 100,
	heading: 90,
	inRestrictedZone: false,
	zoneId: null,
	identityConfirmed: true,
	isRepeatedEntry: false,
	payload: {},
	createdAt: new Date().toISOString(),
};

describe("getThreatLevel", () => {
	it("returns LOW for scores 0-30", () => {
		expect(getThreatLevel(0)).toBe("LOW");
		expect(getThreatLevel(15)).toBe("LOW");
		expect(getThreatLevel(30)).toBe("LOW");
	});

	it("returns MEDIUM for scores 31-70", () => {
		expect(getThreatLevel(31)).toBe("MEDIUM");
		expect(getThreatLevel(50)).toBe("MEDIUM");
		expect(getThreatLevel(70)).toBe("MEDIUM");
	});

	it("returns HIGH for scores 71-100", () => {
		expect(getThreatLevel(71)).toBe("HIGH");
		expect(getThreatLevel(85)).toBe("HIGH");
		expect(getThreatLevel(100)).toBe("HIGH");
	});
});

describe("scoreEvent", () => {
	it("scores 0 for a completely safe event", () => {
		const result = scoreEvent(safeEvent);
		expect(result.threatScore).toBe(0);
		expect(result.scoreBreakdown.restrictedZoneEntry).toBe(0);
		expect(result.scoreBreakdown.unknownIdentity).toBe(0);
		expect(result.scoreBreakdown.highSpeed).toBe(0);
		expect(result.scoreBreakdown.highAltitude).toBe(0);
		expect(result.scoreBreakdown.repeatedEntry).toBe(0);
	});

	it("adds 40 points for restricted zone entry", () => {
		const event: SensorEvent = {
			...safeEvent,
			inRestrictedZone: true,
			zoneId: "zone-1",
		};
		const result = scoreEvent(event);
		expect(result.scoreBreakdown.restrictedZoneEntry).toBe(40);
		expect(result.threatScore).toBe(40);
		expect(result.threatLevel).toBe("MEDIUM");
	});

	it("adds 20 points for unknown identity", () => {
		const event: SensorEvent = { ...safeEvent, identityConfirmed: false };
		const result = scoreEvent(event);
		expect(result.scoreBreakdown.unknownIdentity).toBe(20);
		expect(result.threatScore).toBe(20);
		expect(result.threatLevel).toBe("LOW");
	});

	it("adds 15 points for speed above 150 knots", () => {
		const event: SensorEvent = { ...safeEvent, speedKnots: 151 };
		const result = scoreEvent(event);
		expect(result.scoreBreakdown.highSpeed).toBe(15);
		expect(result.threatScore).toBe(15);
	});

	it("does NOT add points for speed exactly at threshold (150 knots)", () => {
		const event: SensorEvent = { ...safeEvent, speedKnots: 150 };
		const result = scoreEvent(event);
		expect(result.scoreBreakdown.highSpeed).toBe(0);
	});

	it("adds 10 points for altitude above 10,000m", () => {
		const event: SensorEvent = { ...safeEvent, altitudeMeters: 10_001 };
		const result = scoreEvent(event);
		expect(result.scoreBreakdown.highAltitude).toBe(10);
		expect(result.threatScore).toBe(10);
	});

	it("adds 15 points for repeated entry", () => {
		const event: SensorEvent = { ...safeEvent, isRepeatedEntry: true };
		const result = scoreEvent(event);
		expect(result.scoreBreakdown.repeatedEntry).toBe(15);
		expect(result.threatScore).toBe(15);
	});

	it("sums all rules correctly (40+20+15+10+15 = 100)", () => {
		const event: SensorEvent = {
			...safeEvent,
			inRestrictedZone: true,
			zoneId: "zone-1",
			identityConfirmed: false,
			speedKnots: 200,
			altitudeMeters: 12_000,
			isRepeatedEntry: true,
		};
		const result = scoreEvent(event);
		expect(result.scoreBreakdown.restrictedZoneEntry).toBe(40);
		expect(result.scoreBreakdown.unknownIdentity).toBe(20);
		expect(result.scoreBreakdown.highSpeed).toBe(15);
		expect(result.scoreBreakdown.highAltitude).toBe(10);
		expect(result.scoreBreakdown.repeatedEntry).toBe(15);
		expect(result.threatScore).toBe(100);
		expect(result.threatLevel).toBe("HIGH");
	});

	it("clamps the score at 100 even if rules exceed it", () => {
		const event: SensorEvent = {
			...safeEvent,
			inRestrictedZone: true,
			zoneId: "zone-1",
			identityConfirmed: false,
			speedKnots: 200,
			altitudeMeters: 12_000,
			isRepeatedEntry: true,
		};
		const result = scoreEvent(event);
		expect(result.threatScore).toBeLessThanOrEqual(100);
		expect(result.threatScore).toBeGreaterThanOrEqual(0);
	});

	it("returns HIGH for zone entry + unknown identity + repeated entry (40+20+15=75)", () => {
		const event: SensorEvent = {
			...safeEvent,
			inRestrictedZone: true,
			zoneId: "zone-2",
			identityConfirmed: false,
			isRepeatedEntry: true,
		};
		const result = scoreEvent(event);
		expect(result.threatScore).toBe(75);
		expect(result.threatLevel).toBe("HIGH");
	});
});

describe("buildAlertMessage", () => {
	it("includes drone ID and score in the message", () => {
		const event: SensorEvent = {
			...safeEvent,
			inRestrictedZone: true,
			zoneId: "zone-1",
		};
		const message = buildAlertMessage(event, 85);
		expect(message).toContain("DRONE-001");
		expect(message).toContain("85/100");
		expect(message).toContain("zone-1");
	});

	it("mentions unconfirmed identity when applicable", () => {
		const event: SensorEvent = { ...safeEvent, identityConfirmed: false };
		const message = buildAlertMessage(event, 20);
		expect(message).toContain("UNCONFIRMED");
	});
});
