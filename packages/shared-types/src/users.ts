export type Role = "MASTER_ADMIN" | "ADMIN" | "COMMANDER" | "ANALYST";

export interface User {
	id: string;
	username: string;
	email: string;
	createdAt: string;
}

export interface JWTPayload {
	sub: string;
	username: string;
	role: Role;
	iat: number;
	exp: number;
}
