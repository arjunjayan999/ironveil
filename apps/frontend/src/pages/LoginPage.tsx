import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "../auth/context.js";

export function LoginPage() {
	const { login } = useAuth();
	const navigate = useNavigate();

	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit: React.ComponentProps<"form">["onSubmit"] = async (e) => {
		e.preventDefault();
		setError("");
		setLoading(true);
		try {
			await login(username, password);
			navigate("/");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Login failed");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
			<div className="w-full max-w-sm">
				<div className="mb-8 text-center">
					<div className="text-3xl font-bold tracking-widest text-blue-400">
						IRONVEIL
					</div>
					<div className="mt-1 text-sm text-gray-500">
						Defense Intelligence Platform
					</div>
				</div>

				<form
					onSubmit={handleSubmit}
					className="rounded-lg border border-gray-800 bg-gray-900 p-6"
				>
					<h1 className="mb-6 text-base font-semibold text-gray-100">
						Sign in
					</h1>

					{error && (
						<div
							className="mb-4 rounded border border-red-800 bg-red-900/30 px-3 py-2 text-sm text-red-400"
							role="alert"
							data-testid="login-error"
						>
							{error}
						</div>
					)}

					<div className="mb-4">
						<label
							htmlFor="username"
							className="mb-1 block text-xs text-gray-400"
						>
							Username
						</label>
						<input
							id="username"
							name="username"
							type="text"
							autoComplete="username"
							required
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:border-blue-500 focus:outline-none"
						/>
					</div>

					<div className="mb-6">
						<label
							htmlFor="password"
							className="mb-1 block text-xs text-gray-400"
						>
							Password
						</label>
						<input
							id="password"
							name="password"
							type="password"
							autoComplete="current-password"
							required
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:border-blue-500 focus:outline-none"
						/>
					</div>

					<Button type="submit" className="w-full" disabled={loading}>
						{loading ? "Signing in…" : "Sign in"}
					</Button>
				</form>
				<p className="mt-4 text-center text-sm text-gray-400">
					Don't have an account?{" "}
					<Link to="/register" className="text-blue-400 hover:underline">
						Register
					</Link>
				</p>
			</div>
		</div>
	);
}
