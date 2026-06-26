export type ThreatLevel = "LOW" | "MEDIUM" | "HIGH";

export type ThreatStatus = "OPEN" | "UNDER_REVIEW" | "ESCALATED" | "RESOLVED";

export type AlertSeverity = "LOW" | "MEDIUM" | "HIGH";

export interface ScoreBreakdown {
	restrictedZoneEntry: number;
	unknownIdentity: number;
	highSpeed: number;
	highAltitude: number;
	repeatedEntry: number;
}

export interface Threat {
	id: string;
	eventId: string;
	threatScore: number;
	threatLevel: ThreatLevel;
	status: ThreatStatus;
	scoreBreakdown: ScoreBreakdown;
	createdAt: string;
}

export interface Alert {
	id: string;
	threatId: string;
	message: string;
	severity: AlertSeverity;
	createdAt: string;
}

export interface AiSummary {
	id: string;
	threatId: string;
	summary: string;
	modelName: string;
	generatedAt: string;
}
