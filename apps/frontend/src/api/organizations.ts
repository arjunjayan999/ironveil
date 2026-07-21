import type { Role } from "@ironveil/shared-types";
import type { SingleResponse } from "../types/api.js";
import { apiRequest } from "./client.js";

export interface Organization {
	id: string;
	name: string;
	slug: string;
	createdAt: string;
}

export interface OrganizationMembership {
	organizationId: string;
	userId: string;
	role: Role;
	joinedAt: string;
}

export interface OrganizationMember {
	organizationId: string;
	userId: string;
	role: Role;
	joinedAt: string;
}

export interface Invitation {
	id: string;
	organizationId: string;
	email: string;
	role: Role;
	token: string;
	accepted: boolean;
	expiresAt: string;
	createdAt: string;
}

export async function getMyOrganizations(): Promise<OrganizationMembership[]> {
	const result = await apiRequest<SingleResponse<OrganizationMembership[]>>(
		"/api/v1/organizations/me",
	);

	return result.data;
}

export async function createOrganization(
	name: string,
	slug: string,
): Promise<Organization> {
	const result = await apiRequest<SingleResponse<Organization>>(
		"/api/v1/organizations",
		{
			method: "POST",
			body: JSON.stringify({
				name,
				slug,
			}),
		},
	);

	return result.data;
}

export async function deleteOrganization(
	organizationId: string,
): Promise<void> {
	await apiRequest(`/api/v1/organizations/${organizationId}`, {
		method: "DELETE",
	});
}

export async function getOrganizationMembers(
	organizationId: string,
): Promise<OrganizationMember[]> {
	const result = await apiRequest<SingleResponse<OrganizationMember[]>>(
		`/api/v1/organizations/${organizationId}/members`,
	);

	return result.data;
}

export async function addOrganizationMember(
	organizationId: string,
	userId: string,
	role: Role,
): Promise<OrganizationMember> {
	const result = await apiRequest<SingleResponse<OrganizationMember>>(
		`/api/v1/organizations/${organizationId}/members`,
		{
			method: "POST",
			body: JSON.stringify({
				userId,
				role,
			}),
		},
	);

	return result.data;
}

export async function updateOrganizationMemberRole(
	organizationId: string,
	userId: string,
	role: Role,
): Promise<OrganizationMember> {
	const result = await apiRequest<SingleResponse<OrganizationMember>>(
		`/api/v1/organizations/${organizationId}/members/${userId}`,
		{
			method: "PATCH",
			body: JSON.stringify({
				role,
			}),
		},
	);

	return result.data;
}

export async function removeOrganizationMember(
	organizationId: string,
	userId: string,
): Promise<void> {
	await apiRequest(
		`/api/v1/organizations/${organizationId}/members/${userId}`,
		{
			method: "DELETE",
		},
	);
}

export async function getInvitations(
	organizationId: string,
): Promise<Invitation[]> {
	const result = await apiRequest<SingleResponse<Invitation[]>>(
		`/api/v1/organizations/${organizationId}/invitations`,
	);

	return result.data;
}

export async function createInvitation(
	organizationId: string,
	email: string,
	role: Role,
): Promise<Invitation> {
	const result = await apiRequest<SingleResponse<Invitation>>(
		`/api/v1/organizations/${organizationId}/invitations`,
		{
			method: "POST",
			body: JSON.stringify({
				email,
				role,
			}),
		},
	);

	return result.data;
}

export async function deleteInvitation(
	organizationId: string,
	invitationId: string,
): Promise<void> {
	await apiRequest(
		`/api/v1/organizations/${organizationId}/invitations/${invitationId}`,
		{
			method: "DELETE",
		},
	);
}
