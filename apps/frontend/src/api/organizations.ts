import type { Role } from "@ironveil/shared-types";
import type { SingleResponse } from "../types/api.js";
import { apiRequest } from "./client.js";

export interface OrganizationMembership {
	organizationId: string;
	userId: string;
	role: Role;
	joinedAt: string;
}

export async function getMyOrganizations(): Promise<OrganizationMembership[]> {
	const result = await apiRequest<SingleResponse<OrganizationMembership[]>>(
		"/api/v1/organizations/me",
	);
	return result.data;
}
