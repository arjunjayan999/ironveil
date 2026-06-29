import type {
	OrganizationMember,
	OrganizationRole,
} from "@ironveil/shared-types";
import { pool } from "../client.js";

interface OrganizationMemberRow {
	organization_id: string;
	user_id: string;
	role: OrganizationRole;
	joined_at: Date;
}

function toOrganizationMember(row: OrganizationMemberRow): OrganizationMember {
	return {
		organizationId: row.organization_id,
		userId: row.user_id,
		role: row.role,
		joinedAt: row.joined_at,
	};
}

export async function addMember(
	organizationId: string,
	userId: string,
	role: OrganizationRole,
): Promise<OrganizationMember> {
	const result = await pool.query<OrganizationMemberRow>(
		"INSERT INTO organization_members (organization_id, user_id, role) VALUES ($1, $2, $3) RETURNING *",
		[organizationId, userId, role],
	);
	const row = result.rows[0];
	if (!row) {
		throw new Error("Failed to add member");
	}
	return toOrganizationMember(row);
}

export async function findMembership(
	organizationId: string,
	userId: string,
): Promise<OrganizationMember | null> {
	const result = await pool.query<OrganizationMemberRow>(
		"SELECT * FROM organization_members WHERE organization_id = $1 AND user_id = $2",
		[organizationId, userId],
	);
	const row = result.rows[0];
	return row ? toOrganizationMember(row) : null;
}

export async function listMembers(
	organizationId: string,
): Promise<OrganizationMember[]> {
	const result = await pool.query<OrganizationMemberRow>(
		"SELECT * FROM organization_members WHERE organization_id = $1 ORDER BY joined_at",
		[organizationId],
	);
	return result.rows.map(toOrganizationMember);
}

export async function listUserOrganizations(
	userId: string,
): Promise<OrganizationMember[]> {
	const result = await pool.query<OrganizationMemberRow>(
		"SELECT * FROM organization_members WHERE user_id = $1",
		[userId],
	);
	return result.rows.map(toOrganizationMember);
}

export async function updateMemberRole(
	organizationId: string,
	userId: string,
	role: OrganizationRole,
): Promise<OrganizationMember | null> {
	const result = await pool.query<OrganizationMemberRow>(
		"UPDATE organization_members SET role = $1 WHERE organization_id = $2 AND user_id = $3 RETURNING *",
		[role, organizationId, userId],
	);
	const row = result.rows[0];
	return row ? toOrganizationMember(row) : null;
}

export async function removeMember(
	organizationId: string,
	userId: string,
): Promise<boolean> {
	const result = await pool.query(
		"DELETE FROM organization_members WHERE organization_id = $1 AND user_id = $2",
		[organizationId, userId],
	);
	return (result.rowCount ?? 0) > 0;
}
