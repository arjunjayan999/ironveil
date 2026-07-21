import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { getMyOrganizations } from "@/api/organizations.js";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import {
	startSimulator,
	stopSimulator,
	triggerScenario,
} from "../api/simulator.js";
import { createZone, deleteZone, listZones } from "../api/zones.js";
import { useAuth } from "../auth/context.js";

export function SettingsPage() {
	const qc = useQueryClient();
	const [showAddZone, setShowAddZone] = useState(false);
	const [zoneName, setZoneName] = useState("");
	const [zoneLat, setZoneLat] = useState("");
	const [zoneLon, setZoneLon] = useState("");
	const [zoneRadius, setZoneRadius] = useState("");
	const { currentOrganizationId } = useAuth();

	const { data: organizations } = useQuery({
		queryKey: ["organizations"],
		queryFn: getMyOrganizations,
	});

	const currentOrganization = organizations?.find(
		(org) => org.organizationId === currentOrganizationId,
	);

	const { data: zones, isLoading } = useQuery({
		queryKey: ["zones"],
		queryFn: () => listZones(currentOrganization?.organizationId ?? ""),
	});

	const addZone = useMutation({
		mutationFn: () =>
			createZone(currentOrganization?.organizationId ?? "", {
				name: zoneName,
				latitude: parseFloat(zoneLat),
				longitude: parseFloat(zoneLon),
				radiusKm: parseFloat(zoneRadius),
			}),
		onSuccess: () => {
			toast.success("Zone created");
			void qc.invalidateQueries({ queryKey: ["zones"] });
			setShowAddZone(false);
			setZoneName("");
			setZoneLat("");
			setZoneLon("");
			setZoneRadius("");
		},
		onError: (err) =>
			toast.error("Failed to create zone", {
				description: (err as Error).message,
			}),
	});

	const removeZone = useMutation({
		mutationFn: (id: string) =>
			deleteZone(currentOrganization?.organizationId ?? "", id),
		onSuccess: () => {
			toast.success("Zone deleted");
			void qc.invalidateQueries({ queryKey: ["zones"] });
		},
		onError: (err) =>
			toast.error("Failed to delete zone", {
				description: (err as Error).message,
			}),
	});

	const scenario = useMutation({
		mutationFn: (scenario: "mass-incursion" | "cyber-attack" | "quiet") =>
			triggerScenario(scenario, currentOrganization?.organizationId ?? ""),
		onSuccess: (_, vars) => toast.info(`Scenario "${vars}" activated`),
		onError: (err) =>
			toast.error("Scenario failed", {
				description: (err as Error).message,
			}),
	});

	const start = useMutation({
		mutationFn: () => {
			if (!currentOrganizationId) {
				throw new Error("No organization selected");
			}
			return startSimulator(currentOrganizationId);
		},
		onSuccess: () => toast.success("Simulator started"),
		onError: (err) =>
			toast.error("Failed to start simulator", {
				description: (err as Error).message,
			}),
	});

	const stop = useMutation({
		mutationFn: () => {
			if (!currentOrganizationId) {
				throw new Error("No organization selected");
			}
			return stopSimulator(currentOrganizationId);
		},
		onSuccess: () => toast.success("Simulator stopped"),
		onError: (err) =>
			toast.error("Failed to stop simulator", {
				description: (err as Error).message,
			}),
	});

	const inputClass =
		"w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none";

	return (
		<div className="p-6 space-y-6 max-w-3xl">
			<h1 className="text-xl font-bold text-gray-100">Settings</h1>
			<Card>
				<CardHeader>
					<CardTitle>Simulator</CardTitle>
				</CardHeader>

				<CardContent className="space-y-6">
					<div>
						<p className="mb-3 text-sm text-gray-500">
							Start or stop the drone simulator for this organization.
						</p>

						<div className="flex gap-3">
							<Button
								onClick={() => start.mutate()}
								disabled={start.isPending || stop.isPending}
							>
								Start
							</Button>

							<Button
								variant="destructive"
								onClick={() => stop.mutate()}
								disabled={start.isPending || stop.isPending}
							>
								Stop
							</Button>
						</div>
					</div>

					<div className="border-t border-gray-800 pt-6">
						<p className="mb-4 text-sm text-gray-500">
							Activate a scenario to test specific threat patterns. Scenarios
							auto-revert to normal after 30 seconds.
						</p>

						<div className="flex flex-wrap gap-3">
							{(["mass-incursion", "cyber-attack", "quiet"] as const).map(
								(s) => (
									<Button
										key={s}
										variant="secondary"
										onClick={() => scenario.mutate(s)}
										disabled={
											scenario.isPending || start.isPending || stop.isPending
										}
									>
										{s}
									</Button>
								),
							)}
						</div>
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Restricted Zones</CardTitle>

					<CardAction>
						<Button size="sm" onClick={() => setShowAddZone(true)}>
							+ Add Zone
						</Button>
					</CardAction>
				</CardHeader>

				<CardContent>
					{isLoading ? (
						<div className="flex justify-center py-6">
							<Spinner />
						</div>
					) : (
						<div className="divide-y divide-gray-800">
							{zones?.map((zone) => (
								<div
									key={zone.id}
									className="flex items-center justify-between py-3"
								>
									<div>
										<div className="text-sm text-gray-200">{zone.name}</div>

										<div className="text-xs text-gray-500">
											{zone.latitude.toFixed(4)}°N, {zone.longitude.toFixed(4)}
											°E - {zone.radiusKm}km radius
										</div>
									</div>

									<Button
										variant="destructive"
										size="sm"
										onClick={() => removeZone.mutate(zone.id)}
										disabled={removeZone.isPending}
									>
										Delete
									</Button>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
			<Dialog open={showAddZone} onOpenChange={setShowAddZone}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Add Restricted Zone</DialogTitle>
					</DialogHeader>

					<div className="space-y-4">
						<div>
							<label
								htmlFor="zone-name"
								className="mb-1 block text-xs text-gray-400"
							>
								Zone Name
							</label>

							<input
								id="zone-name"
								className={inputClass}
								value={zoneName}
								onChange={(e) => setZoneName(e.target.value)}
								placeholder="e.g. Zone Echo"
							/>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div>
								<label
									htmlFor="zone-lat"
									className="mb-1 block text-xs text-gray-400"
								>
									Latitude
								</label>

								<input
									id="zone-lat"
									className={inputClass}
									value={zoneLat}
									onChange={(e) => setZoneLat(e.target.value)}
									placeholder="51.5074"
								/>
							</div>

							<div>
								<label
									htmlFor="zone-lon"
									className="mb-1 block text-xs text-gray-400"
								>
									Longitude
								</label>

								<input
									id="zone-lon"
									className={inputClass}
									value={zoneLon}
									onChange={(e) => setZoneLon(e.target.value)}
									placeholder="-0.1278"
								/>
							</div>
						</div>

						<div>
							<label
								htmlFor="zone-radius"
								className="mb-1 block text-xs text-gray-400"
							>
								Radius (km)
							</label>

							<input
								id="zone-radius"
								className={inputClass}
								value={zoneRadius}
								onChange={(e) => setZoneRadius(e.target.value)}
								placeholder="5.0"
							/>
						</div>

						<DialogFooter>
							<Button variant="ghost" onClick={() => setShowAddZone(false)}>
								Cancel
							</Button>

							<Button
								onClick={() => addZone.mutate()}
								disabled={
									addZone.isPending ||
									!zoneName ||
									!zoneLat ||
									!zoneLon ||
									!zoneRadius
								}
							>
								{addZone.isPending ? "Creating…" : "Create Zone"}
							</Button>
						</DialogFooter>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
