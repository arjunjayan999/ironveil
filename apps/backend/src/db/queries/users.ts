import type { User } from "@ironveil/shared-types";
import { pool } from "../client.js";

interface UserRow {
	id: string;
	username: string;
	email: string;
	password_hash: string;
	created_at: Date;
}

function toUser(row: UserRow): User {
	return {
		id: row.id,
		username: row.username,
		email: row.email,
		createdAt: row.created_at.toISOString(),
	};
}

export async function findUserByUsername(
	username: string,
): Promise<(User & { passwordHash: string }) | null> {
	const result = await pool.query<UserRow>(
		"SELECT * FROM users WHERE username = $1",
		[username],
	);
	const row = result.rows[0];
	if (!row) return null;
	return { ...toUser(row), passwordHash: row.password_hash };
}

export async function findUserById(id: string): Promise<User | null> {
	const result = await pool.query<UserRow>(
		"SELECT * FROM users WHERE id = $1",
		[id],
	);
	const row = result.rows[0];
	return row ? toUser(row) : null;
}

export async function listUsers(page: number, limit: number) {
	const offset = (page - 1) * limit;
	const [rows, count] = await Promise.all([
		pool.query<UserRow>(
			"SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2",
			[limit, offset],
		),
		pool.query<{ count: string }>("SELECT COUNT(*) FROM users"),
	]);
	return {
		data: rows.rows.map(toUser),
		total: parseInt(count.rows[0]?.count ?? "0", 10),
	};
}

export async function createUser(
	username: string,
	email: string,
	passwordHash: string,
): Promise<User> {
	const result = await pool.query<UserRow>(
		"INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *",
		[username, email, passwordHash],
	);

	const row = result.rows[0];
	if (!row) {
		throw new Error("Failed to create user");
	}
	return toUser(row);
}

export async function deleteUser(id: string): Promise<boolean> {
	const result = await pool.query("DELETE FROM users WHERE id = $1", [id]);
	return (result.rowCount ?? 0) > 0;
}
