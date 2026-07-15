import type { Alert } from "@ironveil/shared-types";
import type { PaginatedResponse } from "../types/api.js";
import { apiRequest } from "./client.js";

export async function listAlerts(
	organizationId: string,
	page = 1,
	limit = 20,
): Promise<PaginatedResponse<Alert>> {
	return apiRequest<PaginatedResponse<Alert>>(
		`/api/v1/organizations/${organizationId}/alerts`,
		{
			params: { page, limit },
		},
	);
}
