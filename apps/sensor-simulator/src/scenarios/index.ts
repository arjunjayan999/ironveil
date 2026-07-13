import { logger } from "@ironveil/logger";

export type ScenarioName = "mass-incursion" | "cyber-attack" | "quiet";
export type SimulatorMode = "normal" | ScenarioName;

const organizationModes = new Map<string, SimulatorMode>();

const organizationTimers = new Map<string, ReturnType<typeof setTimeout>>();

const SCENARIO_DURATION_MS = 30_000;

export function activateScenario(
	organizationId: string,
	scenario: ScenarioName,
): void {
	const existingTimer = organizationTimers.get(organizationId);
	if (existingTimer) {
		clearTimeout(existingTimer);
	}

	organizationModes.set(organizationId, scenario);
	logger.info({ scenario, durationMs: SCENARIO_DURATION_MS });

	const timer = setTimeout(() => {
		organizationModes.set(organizationId, "normal");
		organizationTimers.delete(organizationId);
		logger.info(
			{ scenario, durationMs: SCENARIO_DURATION_MS },
			"Scenario ended, returning to normal mode",
		);
	}, SCENARIO_DURATION_MS);
	organizationTimers.set(organizationId, timer);
}

export function getMode(organizationId: string): SimulatorMode {
	return organizationModes.get(organizationId) ?? "normal";
}

export function isScenarioActive(organizationId: string): boolean {
	return getMode(organizationId) !== "normal";
}
