export type Role = "ADMIN" | "COMMANDER" | "ANALYST";

export interface User {
	id: string;
	username: string;
	email: string;
	role: Role;
	createdAt: string;
}

export interface JWTPayload {
	sub: string;
	username: string;
	role: Role;
	iat: number;
	exp: number;
}
