import maplibregl from "maplibre-gl";
import { useEffect, useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { useQuery } from "@tanstack/react-query";
import type { FeatureCollection } from "geojson";
import { getMyOrganizations } from "@/api/organizations.js";
import { listZones } from "../api/zones.js";
import { useAuth } from "../auth/context.js";
import { useLiveMetrics } from "../hooks/useLiveMetrics.js";

const LEVEL_COLORS: Record<string, string> = {
	HIGH: "#ef4444",
	MEDIUM: "#f59e0b",
	LOW: "#22c55e",
	null: "#6b7280",
};

export function LiveMapPage() {
	const mapContainer = useRef<HTMLDivElement>(null);
	const map = useRef<maplibregl.Map | null>(null);
	const markers = useRef<Map<string, maplibregl.Marker>>(new Map());
	const { currentOrganizationId } = useAuth();

	const { data: organizations } = useQuery({
		queryKey: ["organizations"],
		queryFn: getMyOrganizations,
	});

	const currentOrganization = organizations?.find(
		(org) => org.organizationId === currentOrganizationId,
	);

	const { data: zones } = useQuery({
		queryKey: ["zones"],
		queryFn: () => listZones(currentOrganization?.organizationId ?? ""),
	});

	const { dronePositions } = useLiveMetrics(
		currentOrganization?.organizationId ?? "",
	);

	useEffect(() => {
		if (!mapContainer.current || map.current) return;

		map.current = new maplibregl.Map({
			container: mapContainer.current,
			style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
			center: [4.0, 50.5],
			zoom: 5,
		});

		map.current.addControl(new maplibregl.NavigationControl(), "top-right");

		return () => {
			map.current?.remove();
			map.current = null;
		};
	}, []);

	useEffect(() => {
		const m = map.current;
		if (!m || !zones?.length) return;

		const onLoad = () => {
			if (m.getSource("zones")) {
				m.removeLayer("zones-fill");
				m.removeLayer("zones-border");
				m.removeSource("zones");
			}

			const geojson: FeatureCollection = {
				type: "FeatureCollection",
				features: zones.map((zone) => ({
					type: "Feature",
					properties: { name: zone.name, radiusKm: zone.radiusKm },
					geometry: {
						type: "Point",
						coordinates: [zone.longitude, zone.latitude],
					},
				})),
			};

			m.addSource("zones", { type: "geojson", data: geojson });

			m.addLayer({
				id: "zones-fill",
				type: "circle",
				source: "zones",
				paint: {
					"circle-radius": [
						"interpolate",
						["linear"],
						["zoom"],
						3,
						["*", ["get", "radiusKm"], 1.5],
						8,
						["*", ["get", "radiusKm"], 15],
					],
					"circle-color": "#ef4444",
					"circle-opacity": 0.12,
				},
			});

			m.addLayer({
				id: "zones-border",
				type: "circle",
				source: "zones",
				paint: {
					"circle-radius": [
						"interpolate",
						["linear"],
						["zoom"],
						3,
						["*", ["get", "radiusKm"], 1.5],
						8,
						["*", ["get", "radiusKm"], 15],
					],
					"circle-color": "transparent",
					"circle-stroke-color": "#ef4444",
					"circle-stroke-width": 1.5,
					"circle-opacity": 0,
					"circle-stroke-opacity": 0.6,
				},
			});
		};

		if (m.isStyleLoaded()) {
			onLoad();
		} else {
			m.once("load", onLoad);
		}
	}, [zones]);
	useEffect(() => {
		const m = map.current;
		if (!m) return;

		for (const [droneId, pos] of dronePositions) {
			const color = LEVEL_COLORS[pos.threatLevel ?? "null"] ?? "#6b7280";

			let marker = markers.current.get(droneId);

			if (!marker) {
				const el = document.createElement("div");
				el.style.cssText = `
          width: 10px; height: 10px;
          border-radius: 50%;
          background: ${color};
          border: 2px solid white;
          box-shadow: 0 0 6px ${color};
          cursor: pointer;
        `;

				marker = new maplibregl.Marker({ element: el })
					.setLngLat([pos.longitude, pos.latitude])
					.setPopup(
						new maplibregl.Popup({ offset: 12, closeButton: false }).setHTML(
							`<div style="font-size:12px;color:#111">
                <strong>${droneId}</strong><br/>
                ${pos.latitude.toFixed(4)}°N ${pos.longitude.toFixed(4)}°E<br/>
                Alt: ${pos.altitudeMeters}m | Speed: ${pos.speedKnots}kt
              </div>`,
						),
					)
					.addTo(m);

				markers.current.set(droneId, marker);
			} else {
				marker.setLngLat([pos.longitude, pos.latitude]);
				const el = marker.getElement() as HTMLElement;
				el.style.background = color;
				el.style.boxShadow = `0 0 6px ${color}`;
			}
		}
	}, [dronePositions]);

	return (
		<div className="relative h-full w-full">
			<div ref={mapContainer} className="h-full w-full" />
			<div className="absolute bottom-6 left-4 rounded border border-gray-700 bg-gray-900/90 p-3 text-xs">
				<div className="mb-2 font-semibold text-gray-300">
					Drone Threat Level
				</div>
				{[
					{ label: "HIGH", color: "#ef4444" },
					{ label: "MEDIUM", color: "#f59e0b" },
					{ label: "LOW", color: "#22c55e" },
					{ label: "Unknown", color: "#6b7280" },
				].map((item) => (
					<div key={item.label} className="flex items-center gap-2 mt-1">
						<span
							className="inline-block h-3 w-3 rounded-full border border-white/30"
							style={{ background: item.color }}
						/>
						<span className="text-gray-400">{item.label}</span>
					</div>
				))}
				<div className="mt-3 border-t border-gray-700 pt-2 text-gray-500">
					<span className="inline-block h-3 w-3 rounded-full border border-red-500/60 mr-1.5" />
					Restricted Zone
				</div>
				<div className="mt-1 text-gray-600">
					{dronePositions.size} active drones
				</div>
			</div>
		</div>
	);
}
