import type { AiSummary, Alert, Threat } from "@ironveil/shared-types";
import type { PaginatedResponse, SingleResponse } from "../types/api.js";
import { apiRequest } from "./client.js";

export interface ThreatFilters {
	level?: "LOW" | "MEDIUM" | "HIGH";
	status?: "OPEN" | "UNDER_REVIEW" | "ESCALATED" | "RESOLVED";
	page?: number;
	limit?: number;
}

export interface ThreatDetail extends Threat {
	alert: Alert | null;
	aiSummary: AiSummary | null;
}

export async function listThreats(
	organizationId: string,
	filters: ThreatFilters = {},
): Promise<PaginatedResponse<Threat>> {
	return apiRequest<PaginatedResponse<Threat>>(
		`/api/v1/organizations/${organizationId}/threats`,
		{
			params: {
				level: filters.level,
				status: filters.status,
				page: filters.page ?? 1,
				limit: filters.limit ?? 20,
			},
		},
	);
}

export async function getThreat(
	organizationId: string,
	id: string,
): Promise<ThreatDetail> {
	const result = await apiRequest<SingleResponse<ThreatDetail>>(
		`/api/v1/organizations/${organizationId}/threats/${id}`,
	);
	return result.data;
}

export async function escalateThreat(
	organizationId: string,
	id: string,
): Promise<Threat> {
	const result = await apiRequest<SingleResponse<Threat>>(
		`/api/v1/organizations/${organizationId}/threats/${id}/escalate`,
		{ method: "POST" },
	);
	return result.data;
}

export async function resolveThreat(
	organizationId: string,
	id: string,
): Promise<Threat> {
	const result = await apiRequest<SingleResponse<Threat>>(
		`/api/v1/organizations/${organizationId}/threats/${id}/resolve`,
		{ method: "POST" },
	);
	return result.data;
}
