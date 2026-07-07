import type {
	AuditAction,
	AuditEntityType,
	AuditLog,
} from "@ironveil/shared-types";
import { pool } from "../client.js";

interface AuditRow {
	id: string;
	organization_id: string;
	user_id: string | null;
	action: AuditAction;
	entity_type: AuditEntityType;
	entity_id: string;
	metadata: Record<string, unknown> | null;
	timestamp: Date;
}

function toAuditLog(row: AuditRow): AuditLog {
	return {
		id: row.id,
		organizationId: row.organization_id,
		userId: row.user_id,
		action: row.action,
		entityType: row.entity_type,
		entityId: row.entity_id,
		metadata: row.metadata,
		timestamp: row.timestamp.toISOString(),
	};
}

export interface AuditFilter {
	userId?: string | undefined;
	action?: string | undefined;
	from?: string | undefined;
	to?: string | undefined;
	page: number;
	limit: number;
}

export async function listAuditLogs(
	organizationId: string,
	filter: AuditFilter,
) {
	const conditions: string[] = ["organization_id = $1"];
	const params: unknown[] = [organizationId];
	let paramIndex = 2;

	if (filter.userId) {
		conditions.push(`user_id = $${paramIndex++}`);
		params.push(filter.userId);
	}
	if (filter.action) {
		conditions.push(`action = $${paramIndex++}`);
		params.push(filter.action);
	}
	if (filter.from) {
		conditions.push(`timestamp >= $${paramIndex++}`);
		params.push(filter.from);
	}
	if (filter.to) {
		conditions.push(`timestamp <= $${paramIndex++}`);
		params.push(filter.to);
	}

	const where = `WHERE ${conditions.join(" AND ")}`;
	const offset = (filter.page - 1) * filter.limit;

	const [rows, count] = await Promise.all([
		pool.query<AuditRow>(
			`SELECT * FROM audit_logs ${where} ORDER BY timestamp DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
			[...params, filter.limit, offset],
		),
		pool.query<{ count: string }>(
			`SELECT COUNT(*) as count FROM audit_logs ${where}`,
			params,
		),
	]);
	return {
		data: rows.rows.map(toAuditLog),
		total: parseInt(count.rows[0]?.count ?? "0", 10),
	};
}

export async function writeAuditLog(
	userId: string | null,
	organizationId: string | null,
	action: AuditAction,
	entityType: AuditEntityType,
	entityId: string,
	metadata: Record<string, unknown> | null,
): Promise<void> {
	await pool.query(
		"INSERT INTO audit_logs (user_id, organization_id, action, entity_type, entity_id, metadata) VALUES ($1, $2, $3, $4, $5, $6)",
		[userId, organizationId, action, entityType, entityId, metadata ?? null],
	);
}
