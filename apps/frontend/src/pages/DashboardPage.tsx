import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { getMyOrganizations } from "@/api/organizations.js";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { listThreats } from "../api/threats.js";
import { useAuth } from "../auth/context.js";
import { useLiveMetrics } from "../hooks/useLiveMetrics.js";

function MetricCard({
	label,
	value,
	accent,
}: {
	label: string;
	value: number;
	accent: string;
}) {
	return (
		<Card>
			<CardContent className="flex flex-col gap-1">
				<div className={`text-3xl font-bold tabular-nums ${accent}`}>
					{value}
				</div>
				<div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
					{label}
				</div>
			</CardContent>
		</Card>
	);
}

const threatLevelVariant = {
	HIGH: "high",
	MEDIUM: "medium",
	LOW: "low",
} as const;

const threatStatusVariant = {
	OPEN: "open",
	UNDER_REVIEW: "review",
	ESCALATED: "high",
	RESOLVED: "resolved",
} as const;

export function DashboardPage() {
	const { currentOrganizationId } = useAuth();

	const { data: organizations } = useQuery({
		queryKey: ["organizations"],
		queryFn: getMyOrganizations,
	});

	const currentOrganization = organizations?.find(
		(org) => org.organizationId === currentOrganizationId,
	);
	const metrics = useLiveMetrics(currentOrganization?.organizationId ?? "");
	const { data, isLoading } = useQuery({
		queryKey: ["threats", "recent"],
		queryFn: () =>
			listThreats(currentOrganization?.organizationId ?? "", {
				limit: 10,
				page: 1,
			}),
	});

	const threats =
		metrics.recentThreats.length > 0
			? metrics.recentThreats
			: (data?.data ?? []);

	const latestThreat = metrics.recentThreats[0];

	useEffect(() => {
		if (latestThreat?.threatLevel === "HIGH") {
			toast.error("HIGH Threat Detected", {
				description: `${latestThreat.id.slice(0, 8)}… - Score ${latestThreat.threatScore}/100`,
			});
		}
	}, [latestThreat]);
	return (
		<div className="p-6 space-y-6">
			<h1 className="text-xl font-bold text-gray-100">Operations Dashboard</h1>

			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				<MetricCard
					label="High Threats"
					value={metrics.highCount}
					accent="text-red-400"
				/>
				<MetricCard
					label="Medium Threats"
					value={metrics.mediumCount}
					accent="text-amber-400"
				/>
				<MetricCard
					label="Low Threats"
					value={metrics.lowCount}
					accent="text-green-400"
				/>
				<MetricCard
					label="Active Alerts"
					value={metrics.activeAlerts}
					accent="text-blue-400"
				/>
			</div>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
				<Card className="lg:col-span-2">
					<CardHeader className="border-b border-gray-800">
						<CardTitle className="uppercase tracking-wider text-gray-400">
							Recent Threats
						</CardTitle>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<div className="flex justify-center py-8">
								<Spinner />
							</div>
						) : (
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b border-gray-800 text-left text-xs text-gray-500">
										<th className="pb-2 font-medium">ID</th>
										<th className="pb-2 font-medium">Level</th>
										<th className="pb-2 font-medium">Score</th>
										<th className="pb-2 font-medium">Status</th>
									</tr>
								</thead>
								<tbody>
									{threats.length === 0 && (
										<tr>
											<td
												colSpan={4}
												className="py-6 text-center text-gray-600"
											>
												No threats yet - simulator starting…
											</td>
										</tr>
									)}
									{threats.map((threat) => (
										<tr
											key={threat.id}
											className="border-b border-gray-800/50 last:border-0"
										>
											<td className="py-2">
												<Link
													to={`/threats/${threat.id}`}
													className="font-mono text-xs text-blue-400 hover:underline"
												>
													{threat.id.slice(0, 8)}…
												</Link>
											</td>
											<td className="py-2">
												<Badge variant={threatLevelVariant[threat.threatLevel]}>
													{threat.threatLevel.replace("_", " ")}
												</Badge>
											</td>

											<td className="py-2 tabular-nums text-gray-300">
												{threat.threatScore}
											</td>

											<td className="py-2">
												<Badge variant={threatStatusVariant[threat.status]}>
													{threat.status.replace("_", " ")}
												</Badge>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						)}
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="border-b border-gray-800">
						<CardTitle className="uppercase tracking-wider text-gray-400">
							Live Feed
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2 max-h-72 overflow-y-auto">
							{metrics.activityFeed.length === 0 && (
								<p className="text-xs text-gray-600 py-4 text-center">
									Waiting for events…
								</p>
							)}
							{metrics.activityFeed.map((item) => (
								<div key={item.id} className="flex gap-2 text-xs">
									<span className="shrink-0 text-gray-600 tabular-nums">
										{new Date(item.timestamp).toLocaleTimeString()}
									</span>
									<span className="text-gray-300 truncate">{item.label}</span>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
