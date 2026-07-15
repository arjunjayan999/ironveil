let authToken: string | null = null;

export function setToken(token: string): void {
	authToken = token;
}

export function clearToken(): void {
	authToken = null;
}

export function getToken(): string | null {
	return authToken;
}

interface RequestOptions extends RequestInit {
	params?: Record<string, string | number | undefined>;
}

export async function apiRequest<T>(
	path: string,
	options: RequestOptions = {},
): Promise<T> {
	const { params, ...fetchOptions } = options;
	const url = new URL(path, window.location.origin);
	if (params) {
		for (const [key, value] of Object.entries(params)) {
			if (value !== undefined) {
				url.searchParams.set(key, String(value));
			}
		}
	}

	const headers = new Headers(fetchOptions.headers);
	headers.set("Content-Type", "application/json");

	if (authToken) {
		headers.set("Authorization", `Bearer ${authToken}`);
	}

	const response = await fetch(url.toString(), {
		...fetchOptions,
		headers,
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({
			error: "Unknown Error",
			message: response.statusText,
		}));
		throw new Error(
			(error as { message?: string }).message ?? "Request failed",
		);
	}

	if (response.status === 204) {
		return {} as T;
	}

	return response.json() as Promise<T>;
}
