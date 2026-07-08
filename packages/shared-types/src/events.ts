export type SensorSourceType = "drone" | "radar" | "cyber";

export interface SensorEvent {
	id: string;
	organizationId: string;
	sourceType: SensorSourceType;
	sourceId: string;
	latitude: number;
	longitude: number;
	altitudeMeters: number;
	speedKnots: number;
	heading: number;
	inRestrictedZone: boolean;
	zoneId: string | null;
	identityConfirmed: boolean;
	isRepeatedEntry: boolean;
	payload: Record<string, unknown>;
	createdAt: string;
}

export interface KafkaEnvelope<T> {
	messageId: string;
	timestamp: string;
	version: "1.0";
	payload: T;
}
