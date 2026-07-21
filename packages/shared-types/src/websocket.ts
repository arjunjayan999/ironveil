import type { Alert, Threat } from "./threats.js";

export type WSEventType =
	| "threat_created"
	| "threat_updated"
	| "alert_created"
	| "drone_position"
	| "metrics_update";

export interface WSMessage<T = unknown> {
	event: WSEventType;
	timestamp: string;
	data: T;
}

export interface DronePositionData {
	droneId: string;
	latitude: number;
	longitude: number;
	altitudeMeters: number;
	speedKnots: number;
	threatLevel: "LOW" | "MEDIUM" | "HIGH" | null;
}

export interface MetricsUpdateData {
	highCount: number;
	mediumCount: number;
	lowCount: number;
	activeAlerts: number;
}

export interface ThreatUpdatedData {
	organizationId: string;
	id: string;
	oldStatus: string;
	newStatus: string;
}

export type ThreatCreatedMessage = WSMessage<Threat>;
export type ThreatUpdatedMessage = WSMessage<ThreatUpdatedData>;
export type AlertCreatedMessage = WSMessage<Alert>;
export type DronePositionMessage = WSMessage<DronePositionData>;
export type MetricsUpdateMessage = WSMessage<MetricsUpdateData>;
