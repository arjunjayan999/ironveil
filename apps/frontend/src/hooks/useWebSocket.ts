import type { WSMessage } from "@ironveil/shared-types";
import { useCallback, useEffect, useRef } from "react";
import { getToken } from "../api/client.js";

type MessageHandler = (message: WSMessage) => void;

export function useWebSocket(
	organizationId: string,
	onMessage: MessageHandler,
): void {
	const ws = useRef<WebSocket | null>(null);
	const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const mounted = useRef(true);
	const handlerRef = useRef(onMessage);
	handlerRef.current = onMessage;

	const connect = useCallback(() => {
		const token = getToken();
		if (!token || !mounted.current) return;

		const protocol = window.location.protocol === "https:" ? "wss" : "ws";
		const url = `${protocol}://${window.location.host}/${organizationId}/ws/events?token=${token}`;

		const socket = new WebSocket(url);
		ws.current = socket;

		socket.onopen = () => {
			console.debug("[WS] Connected");
		};

		socket.onmessage = (event: MessageEvent<string>) => {
			try {
				const message = JSON.parse(event.data) as WSMessage;
				handlerRef.current(message);
			} catch {
				console.error("[WS] Failed to parse message", event.data);
			}
		};

		socket.onclose = (event) => {
			console.debug("[WS] Closed", event.code);
			if (!mounted.current) return;
			if (event.code === 4001) return;
			retryTimer.current = setTimeout(connect, 2_000);
		};

		socket.onerror = () => {
			console.debug("[WS] Error (will retry via onclose)");
		};
	}, [organizationId]);

	useEffect(() => {
		mounted.current = true;
		connect();

		return () => {
			mounted.current = false;
			if (retryTimer.current) clearTimeout(retryTimer.current);
			ws.current?.close(1000, "Component unmounted");
		};
	}, [connect]);
}
