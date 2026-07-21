import type { RestrictedZone } from "@ironveil/shared-types";
import type { SingleResponse } from "../types/api.js";
import { apiRequest } from "./client.js";

export async function listZones(
	organizationId: string,
): Promise<RestrictedZone[]> {
	const result = await apiRequest<{ data: RestrictedZone[] }>(
		`/api/v1/organizations/${organizationId}/zones`,
	);
	return result.data;
}

export async function createZone(
	organizationId: string,
	data: {
		name: string;
		latitude: number;
		longitude: number;
		radiusKm: number;
	},
): Promise<RestrictedZone> {
	const result = await apiRequest<SingleResponse<RestrictedZone>>(
		`/api/v1/organizations/${organizationId}/zones`,
		{
			method: "POST",
			body: JSON.stringify(data),
		},
	);
	return result.data;
}

export async function deleteZone(
	organizationId: string,
	id: string,
): Promise<void> {
	await apiRequest(`/api/v1/organizations/${organizationId}/zones/${id}`, {
		method: "DELETE",
	});
}
