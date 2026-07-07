import argon2 from "argon2";
import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { findUserByUsername } from "../db/queries/users.js";
import { authenticate } from "../middleware/auth.js";

const loginBodySchema = z.object({
	username: z.string().min(1),
	password: z.string().min(1),
});

export const authRoutes: FastifyPluginAsync = async (fastify) => {
	fastify.post("/login", async (request, reply) => {
		const result = loginBodySchema.safeParse(request.body);
		if (!result.success) {
			return reply.status(400).send({
				error: "Bad Request",
				message: "username and password are required",
			});
		}
		const { username, password } = result.data;
		const user = await findUserByUsername(username);

		const hash =
			user?.passwordHash ??
			"$argon2id$v=19$m=65536,t=3,p=4$alVvcXZ0Q2Q1SDB5TGUzZw$6YojFQ0y5Au96N2DLuXLZI0GuBmYFRCeZA491d8jA/I";
		const valid = await argon2.verify(hash, password);
		if (!valid || !user) {
			return reply.status(401).send({
				error: "Unauthorized",
				message: "Invalid credentials",
			});
		}
		const token = fastify.jwt.sign(
			{ sub: user.id, username: user.username },
			{ expiresIn: "8h" },
		);
		return reply.send({
			token,
			user: { id: user.id, username: user.username, email: user.email },
		});
	});

	fastify.get("/me", { preHandler: [authenticate] }, async (request, reply) => {
		return reply.send({ user: request.user });
	});
};
