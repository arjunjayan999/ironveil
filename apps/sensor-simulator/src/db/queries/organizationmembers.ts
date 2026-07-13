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
