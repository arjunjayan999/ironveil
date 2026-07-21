import type { User } from "@ironveil/shared-types";
import { apiRequest, clearToken, setToken } from "./client.js";

interface LoginResponse {
	token: string;
	user: User;
}
interface RegisterResponse {
	token: string;
	user: User;
}

export async function login(
	username: string,
	password: string,
): Promise<LoginResponse> {
	const result = await apiRequest<LoginResponse>("/api/v1/auth/login", {
		method: "POST",
		body: JSON.stringify({ username, password }),
	});
	setToken(result.token);
	return result;
}

export async function register(
	username: string,
	email: string,
	password: string,
): Promise<RegisterResponse> {
	const result = await apiRequest<RegisterResponse>("/api/v1/auth/register", {
		method: "POST",
		body: JSON.stringify({
			username,
			email,
			password,
		}),
	});

	setToken(result.token);
	return result;
}

export async function getMe(): Promise<User> {
	const result = await apiRequest<{ user: User }>("/api/v1/auth/me");
	return result.user;
}

export function logout(): void {
	clearToken();
}
