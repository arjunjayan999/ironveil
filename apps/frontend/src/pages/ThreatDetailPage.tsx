import type { ScoreBreakdown } from "@ironveil/shared-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { getSimilarThreats, requestSummary } from "@/api/ai.js";
import { getMyOrganizations } from "@/api/organizations.js";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { escalateThreat, getThreat, resolveThreat } from "../api/threats.js";
import { useAuth } from "../auth/context.js";

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

function ScoreBar({ breakdown }: { breakdown: ScoreBreakdown }) {
	const rules = [
		{
			label: "Zone Entry",
			value: breakdown.restrictedZoneEntry,
			max: 40,
			color: "bg-red-500",
		},
		{
			label: "Unknown ID",
			value: breakdown.unknownIdentity,
			max: 20,
			color: "bg-orange-500",
		},
		{
			label: "High Speed",
			value: breakdown.highSpeed,
			max: 15,
			color: "bg-yellow-500",
		},
		{
			label: "High Alt.",
			value: breakdown.highAltitude,
			max: 10,
			color: "bg-blue-500",
		},
		{
			label: "Repeated",
			value: breakdown.repeatedEntry,
			max: 15,
			color: "bg-purple-500",
		},
	];

	return (
		<div className="space-y-2">
			{rules.map((r) => (
				<div key={r.label} className="flex items-center gap-3 text-xs">
					<span className="w-20 text-gray-500 shrink-0">{r.label}</span>
					<div className="flex-1 h-1.5 rounded bg-gray-800">
						<div
							className={`h-full rounded ${r.color}`}
							style={{ width: `${(r.value / r.max) * 100}%` }}
						/>
					</div>
					<span className="w-8 text-right text-gray-400 tabular-nums">
						+{r.value}
					</span>
				</div>
			))}
		</div>
	);
}

function AiSummaryPanel({
	threatId,
	existingSummary,
}: {
	threatId: string;
	existingSummary: { summary: string; modelName: string } | null;
}) {
	const queryClient = useQueryClient();

	const { data, isLoading, isFetching } = useQuery({
		queryKey: ["ai-summary", threatId],
		queryFn: () => requestSummary(threatId),
		initialData: existingSummary
			? {
					id: "",
					threatId,
					summary: existingSummary.summary,
					modelName: existingSummary.modelName,
					generatedAt: "",
				}
			: undefined,
		staleTime: Number.POSITIVE_INFINITY,
	});

	const generate = useMutation({
		mutationFn: () => requestSummary(threatId, false),
		onSuccess: () => {
			toast.success("Summary generated");
			void queryClient.invalidateQueries({
				queryKey: ["ai-summary", threatId],
			});
		},
		onError: (err) =>
			toast.error("Summary failed", {
				description: (err as Error).message,
			}),
	});

	if (isLoading || isFetching || generate.isPending) {
		return (
			<div className="flex items-center gap-3 py-4">
				<Spinner size="sm" />
				<span className="text-sm text-muted-foreground">
					Generating intelligence summary…
				</span>
			</div>
		);
	}

	if (!data) {
		return (
			<div className="flex flex-col items-center gap-3 py-6">
				<p className="text-sm text-muted-foreground">
					No summary has been generated yet.
				</p>
				<Button size="sm" onClick={() => generate.mutate()}>
					Generate Summary
				</Button>
			</div>
		);
	}

	return (
		<div>
			<p className="text-sm leading-relaxed text-muted-foreground">
				{data.summary}
			</p>

			<div className="mt-3 flex items-center justify-between">
				<span className="text-xs text-muted-foreground">
					Model: {data.modelName}
				</span>

				<Button variant="ghost" size="sm" onClick={() => generate.mutate()}>
					Regenerate
				</Button>
			</div>
		</div>
	);
}

function SimilarIncidentsPanel({
	threatId,
	hasSummary,
}: {
	threatId: string;
	hasSummary: boolean;
}) {
	const { data, isLoading } = useQuery({
		queryKey: ["similar-threats", threatId],
		queryFn: () => getSimilarThreats(threatId),
		enabled: hasSummary,
	});

	if (!hasSummary) {
		return (
			<p className="text-sm text-muted-foreground">
				Generate a summary first to enable similarity search.
			</p>
		);
	}

	if (isLoading) {
		return (
			<div className="flex justify-center py-4">
				<Spinner size="sm" />
			</div>
		);
	}

	if (!data?.length) {
		return (
			<p className="text-sm text-muted-foreground">
				No similar incidents found.
			</p>
		);
	}

	return (
		<div className="space-y-2">
			{data.map((item) => (
				<Link
					key={item.threatId}
					to={`/threats/${item.threatId}`}
					className="block rounded border p-3 transition-colors hover:bg-muted/50"
				>
					<div className="mb-1 flex items-center justify-between">
						<span className="font-mono text-xs text-primary">
							{item.threatId.slice(0, 12)}…
						</span>

						<span className="text-xs text-muted-foreground">
							Similarity: {(item.score * 100).toFixed(0)}%
						</span>
					</div>

					<p className="truncate text-xs text-muted-foreground">
						{item.payload.summaryPreview}
					</p>
				</Link>
			))}
		</div>
	);
}

export function ThreatDetailPage() {
	const { id } = useParams<{ id: string }>();
	const { currentOrganizationId } = useAuth();

	const { data: organizations } = useQuery({
		queryKey: ["organizations"],
		queryFn: getMyOrganizations,
	});

	const currentOrganization = organizations?.find(
		(org) => org.organizationId === currentOrganizationId,
	);
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const requireId = () => {
		if (!id) {
			throw new Error("Missing threat ID");
		}
		return id;
	};

	const {
		data: threat,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["threat", id],
		queryFn: () =>
			getThreat(currentOrganization?.organizationId ?? "", requireId()),
	});

	const invalidate = () => {
		void queryClient.invalidateQueries({ queryKey: ["threat", id] });
		void queryClient.invalidateQueries({ queryKey: ["threats"] });
	};

	const escalate = useMutation({
		mutationFn: () =>
			escalateThreat(currentOrganization?.organizationId ?? "", requireId()),
		onSuccess: () => {
			toast.warning("Threat escalated");
			invalidate();
		},
		onError: (err) =>
			toast.error("Failed to escalate", {
				description: (err as Error).message,
			}),
	});

	const resolve = useMutation({
		mutationFn: () =>
			resolveThreat(currentOrganization?.organizationId ?? "", requireId()),
		onSuccess: () => {
			toast.success("Threat resolved");
			invalidate();
		},
		onError: (err) =>
			toast.error("Failed to resolve", {
				description: (err as Error).message,
			}),
	});

	const canAct =
		currentOrganization?.role === "ADMIN" ||
		currentOrganization?.role === "COMMANDER";

	if (isLoading) {
		return (
			<div className="flex justify-center py-20">
				<Spinner size="lg" />
			</div>
		);
	}

	if (error || !threat) {
		return (
			<div className="p-6 text-center text-gray-500">
				Threat not found.{" "}
				<button
					type="button"
					className="text-blue-400 hover:underline"
					onClick={() => navigate(-1)}
				>
					Go back
				</button>
			</div>
		);
	}

	return (
		<div className="p-6 space-y-4 max-w-4xl">
			<div className="flex items-start justify-between gap-4">
				<div>
					<button
						type="button"
						className="mb-2 text-xs text-gray-500 hover:text-gray-300"
						onClick={() => navigate(-1)}
					>
						← Back
					</button>
					<h1 className="text-base font-mono text-gray-300">
						Threat <span className="text-gray-100">{threat.id}</span>
					</h1>
					<div className="mt-2 flex items-center gap-2">
						<Badge variant={threatLevelVariant[threat.threatLevel]} size="md">
							{threat.threatLevel}
						</Badge>
						<Badge variant={threatStatusVariant[threat.status]} size="md">
							{threat.status.replaceAll("_", " ")}
						</Badge>
						<span className="text-xs text-gray-500">
							{new Date(threat.createdAt).toLocaleString()}
						</span>
					</div>
				</div>

				{canAct && (
					<div className="flex gap-2 shrink-0">
						<Button
							variant="secondary"
							onClick={() => escalate.mutate()}
							disabled={
								escalate.isPending ||
								threat.status === "ESCALATED" ||
								threat.status === "RESOLVED"
							}
						>
							{escalate.isPending ? "Escalating…" : "Escalate"}
						</Button>
						<Button
							variant="primary"
							onClick={() => resolve.mutate()}
							disabled={resolve.isPending || threat.status === "RESOLVED"}
						>
							{resolve.isPending ? "Resolving…" : "Resolve"}
						</Button>
					</div>
				)}
			</div>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<Card>
					<CardHeader className="border-b">
						<CardTitle>Score Breakdown</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="mb-3 text-3xl font-bold tabular-nums">
							{threat.threatScore}
							<span className="text-lg text-muted-foreground">/100</span>
						</div>
						<ScoreBar breakdown={threat.scoreBreakdown} />
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="border-b">
						<CardTitle>Intelligence Summary</CardTitle>
					</CardHeader>
					<CardContent>
						<AiSummaryPanel
							threatId={threat.id}
							existingSummary={threat.aiSummary}
						/>
					</CardContent>
				</Card>
			</div>

			{threat.alert && (
				<Card>
					<CardHeader className="border-b">
						<CardTitle>Alert</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex items-start gap-3">
							<Badge variant={threatLevelVariant[threat.alert.severity]}>
								{threat.alert.severity}
							</Badge>
							<p className="text-sm text-muted-foreground">
								{threat.alert.message}
							</p>
						</div>
					</CardContent>
				</Card>
			)}
			<Card>
				<CardHeader className="border-b">
					<CardTitle>Similar Incidents</CardTitle>
				</CardHeader>

				<CardContent>
					<SimilarIncidentsPanel
						threatId={threat.id}
						hasSummary={!!threat.aiSummary}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
