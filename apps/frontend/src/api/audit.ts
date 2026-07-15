import type { AuditLog } from "@ironveil/shared-types";
import type { PaginatedResponse } from "../types/api.js";
import { apiRequest } from "./client.js";

export interface AuditFilters {
	userId?: string;
	action?: string;
	from?: string;
	to?: string;
	page?: number;
	limit?: number;
}

export async function listAuditLogs(
	organizationId: string,
	filters: AuditFilters = {},
): Promise<PaginatedResponse<AuditLog>> {
	return apiRequest<PaginatedResponse<AuditLog>>(
		`/api/v1/organizations/${organizationId}/audit`,
		{
			params: {
				userId: filters.userId,
				action: filters.action,
				from: filters.from,
				to: filters.to,
				page: filters.page ?? 1,
				limit: filters.limit ?? 50,
			},
		},
	);
}
