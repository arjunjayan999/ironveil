import type { ThreatLevel, ThreatStatus } from "@ironveil/shared-types";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router";
import { getMyOrganizations } from "@/api/organizations.js";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { listThreats } from "../api/threats.js";
import { useAuth } from "../auth/context.js";

const LEVELS: Array<ThreatLevel | ""> = ["", "HIGH", "MEDIUM", "LOW"];
const STATUSES: Array<ThreatStatus | ""> = [
	"",
	"OPEN",
	"UNDER_REVIEW",
	"ESCALATED",
	"RESOLVED",
];

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

export function ThreatCenterPage() {
	const { currentOrganizationId } = useAuth();

	const { data: organizations } = useQuery({
		queryKey: ["organizations"],
		queryFn: getMyOrganizations,
	});

	const currentOrganization = organizations?.find(
		(org) => org.organizationId === currentOrganizationId,
	);
	const [level, setLevel] = useState<ThreatLevel | "">("");
	const [status, setStatus] = useState<ThreatStatus | "">("");
	const [page, setPage] = useState(1);

	const { data, isLoading, isFetching } = useQuery({
		queryKey: ["threats", { level, status, page }],
		queryFn: () =>
			listThreats(currentOrganization?.organizationId ?? "", {
				level: level || undefined,
				status: status || undefined,
				page,
				limit: 20,
			}),
	});

	const selectClass =
		"rounded border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-200 focus:border-blue-500 focus:outline-none";

	return (
		<div className="p-6 space-y-4">
			<div className="flex items-center justify-between">
				<h1 className="text-xl font-bold text-gray-100">Threat Center</h1>
				{isFetching && <Spinner size="sm" />}
			</div>

			<div className="flex flex-wrap gap-3">
				<select
					value={level}
					onChange={(e) => {
						setLevel(e.target.value as ThreatLevel | "");
						setPage(1);
					}}
					className={selectClass}
				>
					{LEVELS.map((l) => (
						<option key={l} value={l}>
							{l === "" ? "All Levels" : l}
						</option>
					))}
				</select>

				<select
					value={status}
					onChange={(e) => {
						setStatus(e.target.value as ThreatStatus | "");
						setPage(1);
					}}
					className={selectClass}
				>
					{STATUSES.map((s) => (
						<option key={s} value={s}>
							{s === "" ? "All Statuses" : s}
						</option>
					))}
				</select>

				{(level || status) && (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => {
							setLevel("");
							setStatus("");
							setPage(1);
						}}
					>
						Clear filters
					</Button>
				)}
			</div>

			<div className="rounded-lg border border-gray-800 bg-gray-900 overflow-hidden">
				{isLoading ? (
					<div className="flex justify-center py-12">
						<Spinner />
					</div>
				) : (
					<table className="w-full text-sm">
						<thead className="border-b border-gray-800 bg-gray-800/50">
							<tr className="text-left text-xs text-gray-500">
								<th className="px-4 py-3 font-medium">Threat ID</th>
								<th className="px-4 py-3 font-medium">Level</th>
								<th className="px-4 py-3 font-medium">Score</th>
								<th className="px-4 py-3 font-medium">Status</th>
								<th className="px-4 py-3 font-medium">Created</th>
							</tr>
						</thead>
						<tbody>
							{data?.data.length === 0 && (
								<tr>
									<td
										colSpan={5}
										className="py-10 text-center text-sm text-gray-600"
									>
										No threats match the selected filters.
									</td>
								</tr>
							)}
							{data?.data.map((threat) => (
								<tr
									key={threat.id}
									className="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30 transition-colors"
								>
									<td className="px-4 py-3">
										<Link
											to={`/threats/${threat.id}`}
											className="font-mono text-xs text-blue-400 hover:underline"
										>
											{threat.id.slice(0, 12)}…
										</Link>
									</td>
									<td className="px-4 py-3">
										<Badge variant={threatLevelVariant[threat.threatLevel]}>
											{threat.threatLevel.replace("_", " ")}
										</Badge>
									</td>
									<td className="px-4 py-3 tabular-nums text-gray-300">
										{threat.threatScore}
									</td>
									<td className="px-4 py-3">
										<Badge variant={threatStatusVariant[threat.status]}>
											{threat.status.replace("_", " ")}
										</Badge>
									</td>
									<td className="px-4 py-3 text-xs text-gray-500">
										{new Date(threat.createdAt).toLocaleString()}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>

			{data && data.meta.totalPages > 1 && (
				<div className="flex items-center justify-between text-sm text-gray-500">
					<span>
						Page {data.meta.page} of {data.meta.totalPages} - {data.meta.total}{" "}
						total
					</span>
					<div className="flex gap-2">
						<Button
							variant="secondary"
							size="sm"
							disabled={page === 1}
							onClick={() => setPage((p) => p - 1)}
						>
							Previous
						</Button>
						<Button
							variant="secondary"
							size="sm"
							disabled={page === data.meta.totalPages}
							onClick={() => setPage((p) => p + 1)}
						>
							Next
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
