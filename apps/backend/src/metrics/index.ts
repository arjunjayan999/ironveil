import {
	Counter,
	collectDefaultMetrics,
	Gauge,
	Histogram,
	register,
} from "prom-client";

collectDefaultMetrics({ prefix: "ironveil_" });

export const httpRequestsTotal = new Counter({
	name: "ironveil_http_requests_total",
	help: "Total number of HTTP requests",
	labelNames: ["method", "route", "status"] as const,
});

export const httpRequestDuration = new Histogram({
	name: "ironveil_http_request_duration_seconds",
	help: "HTTP request duration in seconds",
	labelNames: ["method", "route", "status"] as const,
});

export const wsConnectedUsers = new Gauge({
	name: "ironveil_websocket_connected_users",
	help: "Number of active WebSocket connections",
});

export const threatCreatedTotal = new Counter({
	name: "ironveil_threat_created_total",
	help: "Total threats created, by level",
	labelNames: ["threat_level"] as const,
});

export { register };
