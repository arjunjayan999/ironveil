export type AuditAction =
	| "THREAT_CREATED"
	| "THREAT_ESCALATED"
	| "THREAT_RESOLVED"
	| "ALERT_CREATED"
	| "USER_CREATED"
	| "USER_DELETED"
	| "ZONE_CREATED"
	| "ZONE_DELETED"
	| "ORGANIZATION_CREATED"
	| "ORGANIZATION_DELETED"
	| "ORGANIZATION_MEMBER_ADDED"
	| "ORGANIZATION_MEMBER_ROLE_UPDATED"
	| "ORGANIZATION_MEMBER_REMOVED"
	| "INVITATION_CREATED"
	| "INVITATION_ACCEPTED"
	| "INVITATION_DELETED";

export type AuditEntityType =
	| "threat"
	| "alert"
	| "user"
	| "zone"
	| "organization"
	| "organization-members"
	| "invitation";

export interface AuditLog {
	id: string;
	organizationId: string;
	userId: string | null;
	action: AuditAction;
	entityType: AuditEntityType;
	entityId: string;
	metadata: Record<string, unknown> | null;
	timestamp: string;
}
