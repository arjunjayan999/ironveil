import type { User } from "@ironveil/shared-types";
import { createContext, type ReactNode, useContext, useState } from "react";
import { login as apiLogin, logout as apiLogout } from "../api/auth.js";

interface AuthState {
	user: User | null;
	isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
	login: (username: string, password: string) => Promise<void>;
	logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [state, setState] = useState<AuthState>({
		user: null,
		isAuthenticated: false,
	});

	const login = async (username: string, password: string) => {
		const { user } = await apiLogin(username, password);
		setState({ user, isAuthenticated: true });
	};

	const logout = () => {
		apiLogout();
		setState({ user: null, isAuthenticated: false });
	};

	return (
		<AuthContext.Provider value={{ ...state, login, logout }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth(): AuthContextValue {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used within AuthProvider");
	return ctx;
}
