export interface Organization {
	id: string;
	name: string;
	slug: string;
	createdBy: string;
	createdAt: string;
}

export type OrganizationRole =
	| "MASTER_ADMIN"
	| "ADMIN"
	| "COMMANDER"
	| "ANALYST";

export interface OrganizationMember {
	organizationId: string;
	userId: string;
	role: OrganizationRole;
	joinedAt: Date;
}

export interface OrganizationInvitation {
	id: string;
	organizationId: string;
	email: string;
	role: OrganizationRole;
	invitedBy: string;
	token: string;
	expiresAt: Date;
	accepted: boolean;
	createdAt: Date;
}
