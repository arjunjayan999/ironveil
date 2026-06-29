import type { Organization } from "@ironveil/shared-types";
import { pool } from "../client.js";

interface OrganizationRow {
	id: string;
	name: string;
	slug: string;
	created_by: string;
	created_at: Date;
}

function toOrganization(row: OrganizationRow): Organization {
	return {
		id: row.id,
		name: row.name,
		slug: row.slug,
		createdBy: row.created_by,
		createdAt: row.created_at.toISOString(),
	};
}

export async function findOrganizationById(
	id: string,
): Promise<Organization | null> {
	const result = await pool.query<OrganizationRow>(
		"SELECT * FROM organizations WHERE id = $1",
		[id],
	);
	const row = result.rows[0];
	return row ? toOrganization(row) : null;
}

export async function findOrganizationBySlug(
	slug: string,
): Promise<Organization | null> {
	const result = await pool.query<OrganizationRow>(
		"SELECT * FROM organizations WHERE slug = $1",
		[slug],
	);
	const row = result.rows[0];
	return row ? toOrganization(row) : null;
}

export async function listOrganizations(page: number, limit: number) {
	const offset = (page - 1) * limit;
	const [rows, count] = await Promise.all([
		pool.query<OrganizationRow>(
			"SELECT * FROM organizations ORDER BY created_at DESC LIMIT $1 OFFSET $2",
			[limit, offset],
		),
		pool.query<{ count: string }>("SELECT COUNT(*) FROM organizations"),
	]);
	return {
		data: rows.rows.map(toOrganization),
		total: parseInt(count.rows[0]?.count ?? "0", 10),
	};
}

export async function createOrganization(
	name: string,
	slug: string,
	createdBy: string,
): Promise<Organization> {
	const result = await pool.query<OrganizationRow>(
		"INSERT INTO organizations (name, slug, created_by) VALUES ($1, $2, $3) RETURNING *",
		[name, slug, createdBy],
	);
	const row = result.rows[0];
	if (!row) {
		throw new Error("Failed to create organization");
	}
	return toOrganization(row);
}

export async function deleteOrganization(id: string): Promise<boolean> {
	const result = await pool.query("DELETE FROM organizations WHERE id = $1", [
		id,
	]);
	return (result.rowCount ?? 0) > 0;
}
