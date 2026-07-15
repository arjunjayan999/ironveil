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
