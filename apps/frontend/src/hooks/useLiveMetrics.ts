import type {
	Alert,
	DronePositionData,
	MetricsUpdateData,
	Threat,
	ThreatUpdatedData,
	WSMessage,
} from "@ironveil/shared-types";
import { useState } from "react";
import { useWebSocket } from "./useWebSocket.js";

export interface LiveMetrics {
	highCount: number;
	mediumCount: number;
	lowCount: number;
	activeAlerts: number;
	recentThreats: Threat[];
	recentAlerts: Alert[];
	activityFeed: Array<{
		id: string;
		event: string;
		timestamp: string;
		label: string;
	}>;
	dronePositions: Map<string, DronePositionData>;
}

const MAX_RECENT = 10;
const MAX_FEED = 20;

export function useLiveMetrics(organizationId: string): LiveMetrics {
	const [metrics, setMetrics] = useState<LiveMetrics>({
		highCount: 0,
		mediumCount: 0,
		lowCount: 0,
		activeAlerts: 0,
		recentThreats: [],
		recentAlerts: [],
		activityFeed: [],
		dronePositions: new Map(),
	});

	const handleMessage = (msg: WSMessage) => {
		setMetrics((prev) => {
			const feedEntry = (label: string) => ({
				id: `${msg.event}-${msg.timestamp}`,
				event: msg.event,
				timestamp: msg.timestamp,
				label,
			});

			switch (msg.event) {
				case "metrics_update": {
					const d = msg.data as MetricsUpdateData;
					return {
						...prev,
						highCount: d.highCount,
						mediumCount: d.mediumCount,
						lowCount: d.lowCount,
						activeAlerts: d.activeAlerts,
					};
				}

				case "threat_created": {
					const threat = msg.data as Threat;
					return {
						...prev,
						recentThreats: [threat, ...prev.recentThreats].slice(0, MAX_RECENT),
						activityFeed: [
							feedEntry(
								`New ${threat.threatLevel} threat: ${threat.id.slice(0, 8)}…`,
							),
							...prev.activityFeed,
						].slice(0, MAX_FEED),
					};
				}

				case "threat_updated": {
					const update = msg.data as ThreatUpdatedData;
					return {
						...prev,
						activityFeed: [
							feedEntry(
								`Threat ${update.threatId.slice(0, 8)}… → ${update.newStatus}`,
							),
							...prev.activityFeed,
						].slice(0, MAX_FEED),
					};
				}

				case "alert_created": {
					const alert = msg.data as Alert;
					return {
						...prev,
						recentAlerts: [alert, ...prev.recentAlerts].slice(0, MAX_RECENT),
						activityFeed: [
							feedEntry(
								`Alert: ${alert.severity} — ${alert.message.slice(0, 60)}…`,
							),
							...prev.activityFeed,
						].slice(0, MAX_FEED),
					};
				}

				case "drone_position": {
					const pos = msg.data as DronePositionData;
					const next = new Map(prev.dronePositions);
					next.set(pos.droneId, pos);
					return { ...prev, dronePositions: next };
				}

				default:
					return prev;
			}
		});
	};

	useWebSocket(organizationId, handleMessage);

	return metrics;
}
