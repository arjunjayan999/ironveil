import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getMyOrganizations } from "@/api/organizations.js";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { listAuditLogs } from "../api/audit.js";
import { useAuth } from "../auth/context.js";

export function AuditCenterPage() {
	const [page, setPage] = useState(1);
	const [action, setAction] = useState("");
	const { currentOrganizationId } = useAuth();

	const { data: organizations } = useQuery({
		queryKey: ["organizations"],
		queryFn: getMyOrganizations,
	});

	const currentOrganization = organizations?.find(
		(org) => org.organizationId === currentOrganizationId,
	);

	const { data, isLoading } = useQuery({
		queryKey: ["audit", { page, action }],
		queryFn: () =>
			listAuditLogs(currentOrganization?.organizationId ?? "", {
				page,
				limit: 50,
				action: action || undefined,
			}),
	});

	return (
		<div className="p-6 space-y-4">
			<h1 className="text-xl font-bold text-gray-100">Audit Center</h1>

			<div className="flex gap-3">
				<input
					type="text"
					placeholder="Filter by action (e.g. THREAT_ESCALATED)"
					value={action}
					onChange={(e) => {
						setAction(e.target.value);
						setPage(1);
					}}
					className="rounded border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-200 placeholder-gray-600 focus:border-blue-500 focus:outline-none w-72"
				/>
				{action && (
					<Button variant="ghost" size="sm" onClick={() => setAction("")}>
						Clear
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
								<th className="px-4 py-3 font-medium">Timestamp</th>
								<th className="px-4 py-3 font-medium">Action</th>
								<th className="px-4 py-3 font-medium">Entity</th>
								<th className="px-4 py-3 font-medium">User</th>
							</tr>
						</thead>
						<tbody>
							{data?.data.length === 0 && (
								<tr>
									<td
										colSpan={4}
										className="py-10 text-center text-sm text-gray-600"
									>
										No audit logs found.
									</td>
								</tr>
							)}
							{data?.data.map((log) => (
								<tr
									key={log.id}
									className="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/20"
								>
									<td className="px-4 py-2 text-xs text-gray-500 tabular-nums">
										{new Date(log.timestamp).toLocaleString()}
									</td>
									<td className="px-4 py-2">
										<span className="font-mono text-xs text-amber-400">
											{log.action}
										</span>
									</td>
									<td className="px-4 py-2 text-xs text-gray-400 font-mono">
										{log.entityType}/{log.entityId.slice(0, 8)}…
									</td>
									<td className="px-4 py-2 text-xs text-gray-500">
										{log.userId ? `${log.userId.slice(0, 8)}…` : "system"}
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
						Page {data.meta.page} of {data.meta.totalPages}
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
