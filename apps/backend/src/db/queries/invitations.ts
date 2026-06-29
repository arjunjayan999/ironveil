import type {
	OrganizationInvitation,
	OrganizationRole,
} from "@ironveil/shared-types";
import { pool } from "../client.js";

interface OrganizationInvitationRow {
	id: string;
	organization_id: string;
	email: string;
	role: OrganizationRole;
	invited_by: string;
	token: string;
	expires_at: Date;
	accepted: boolean;
	created_at: Date;
}

function toOrganizationInvitation(
	row: OrganizationInvitationRow,
): OrganizationInvitation {
	return {
		id: row.id,
		organizationId: row.organization_id,
		email: row.email,
		role: row.role,
		invitedBy: row.invited_by,
		token: row.token,
		expiresAt: row.expires_at,
		accepted: row.accepted,
		createdAt: row.created_at,
	};
}

export async function createInvitation(
	organizationId: string,
	email: string,
	role: OrganizationRole,
	invitedBy: string,
	expiresAt: Date,
): Promise<OrganizationInvitation> {
	const result = await pool.query<OrganizationInvitationRow>(
		"INSERT INTO organization_invitations (organization_id, email, role, invited_by, expires_at) VALUES ($1, $2, $3, $4, $5) RETURNING *",
		[organizationId, email, role, invitedBy, expiresAt],
	);
	const row = result.rows[0];
	if (!row) {
		throw new Error("Failed to create invitation");
	}
	return toOrganizationInvitation(row);
}

export async function findInvitationById(
	id: string,
): Promise<OrganizationInvitation | null> {
	const result = await pool.query<OrganizationInvitationRow>(
		"SELECT * FROM organization_invitations WHERE id = $1",
		[id],
	);
	const row = result.rows[0];
	return row ? toOrganizationInvitation(row) : null;
}

export async function findInvitationByToken(
	token: string,
): Promise<OrganizationInvitation | null> {
	const result = await pool.query<OrganizationInvitationRow>(
		"SELECT * FROM organization_invitations WHERE token = $1",
		[token],
	);
	const row = result.rows[0];
	return row ? toOrganizationInvitation(row) : null;
}

export async function listInvitations(
	organizationId: string,
): Promise<OrganizationInvitation[]> {
	const result = await pool.query<OrganizationInvitationRow>(
		"SELECT * FROM organization_invitations WHERE organization_id = $1 ORDER BY created_at DESC",
		[organizationId],
	);
	return result.rows.map(toOrganizationInvitation);
}

export async function findPendingInvitationByEmail(
	email: string,
): Promise<OrganizationInvitation[]> {
	const result = await pool.query<OrganizationInvitationRow>(
		"SELECT * FROM organization_invitations WHERE email = $1 AND accepted = FALSE AND expires_at > NOW()",
		[email],
	);
	return result.rows.map(toOrganizationInvitation);
}

export async function acceptInvitation(
	id: string,
): Promise<OrganizationInvitation | null> {
	const result = await pool.query<OrganizationInvitationRow>(
		"UPDATE organization_invitations SET accepted = TRUE WHERE id = $1 RETURNING *",
		[id],
	);
	const row = result.rows[0];
	return row ? toOrganizationInvitation(row) : null;
}

export async function deleteInvitation(id: string): Promise<boolean> {
	const result = await pool.query(
		"DELETE FROM organization_invitations WHERE id = $1",
		[id],
	);
	return (result.rowCount ?? 0) > 0;
}

export async function deleteExpiredInvitations(): Promise<number> {
	const result = await pool.query(
		"DELETE FROM organization_invitations WHERE expires_at < NOW()",
	);
	return result.rowCount ?? 0;
}
