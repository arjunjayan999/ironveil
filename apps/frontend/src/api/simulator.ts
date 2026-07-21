import { apiRequest } from "./client.js";

export async function triggerScenario(
	scenario: "mass-incursion" | "cyber-attack" | "quiet",
	organizationId: string,
): Promise<void> {
	await apiRequest(`/api/v1/simulator/${organizationId}/scenario`, {
		method: "POST",
		body: JSON.stringify({ scenario }),
	});
}

export async function startSimulator(organizationId: string): Promise<void> {
	await apiRequest(`/api/v1/simulator/${organizationId}/start`, {
		method: "POST",
	});
}

export async function stopSimulator(organizationId: string): Promise<void> {
	await apiRequest(`/api/v1/simulator/${organizationId}/stop`, {
		method: "POST",
	});
}
