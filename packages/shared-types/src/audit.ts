export type AuditAction =
	| "THREAT_CREATED"
	| "THREAT_ESCALATED"
	| "THREAT_RESOLVED"
	| "ALERT_CREATED"
	| "USER_CREATED"
	| "USER_DELETED"
	| "ZONE_CREATED"
	| "ZONE_DELETED";

export type AuditEntityType = "threat" | "alert" | "user" | "zone";

export interface AuditLog {
	id: string;
	userId: string | null;
	action: AuditAction;
	entityType: AuditEntityType;
	entityId: string;
	metadata: Record<string, unknown> | null;
	timestamp: string;
}
