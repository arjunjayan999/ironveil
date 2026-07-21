import type { User } from "@ironveil/shared-types";
import { createContext, type ReactNode, useContext, useState } from "react";
import {
	login as apiLogin,
	logout as apiLogout,
	register as apiRegister,
} from "../api/auth.js";
import { getMyOrganizations } from "../api/organizations.js";

interface AuthState {
	user: User | null;
	currentOrganizationId: string | null;
	isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
	setCurrentOrganization: (organizationId: string) => void;
	login: (username: string, password: string) => Promise<void>;
	register: (
		username: string,
		email: string,
		password: string,
	) => Promise<void>;
	logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [state, setState] = useState<AuthState>({
		user: null,
		currentOrganizationId: null,
		isAuthenticated: false,
	});

	const login = async (username: string, password: string) => {
		const { user } = await apiLogin(username, password);
		const organizations = await getMyOrganizations();

		setState({
			user,
			currentOrganizationId: organizations[0]?.organizationId ?? null,
			isAuthenticated: true,
		});
	};

	const register = async (
		username: string,
		email: string,
		password: string,
	) => {
		const { user } = await apiRegister(username, email, password);
		const organizations = await getMyOrganizations();

		setState({
			user,
			currentOrganizationId: organizations[0]?.organizationId ?? null,
			isAuthenticated: true,
		});
	};

	const logout = () => {
		apiLogout();
		setState({
			user: null,
			currentOrganizationId: null,
			isAuthenticated: false,
		});
	};

	const setCurrentOrganization = (organizationId: string) => {
		setState((prev) => ({
			...prev,
			currentOrganizationId: organizationId,
		}));
	};

	return (
		<AuthContext.Provider
			value={{
				...state,
				setCurrentOrganization,
				login,
				register,
				logout,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth(): AuthContextValue {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used within AuthProvider");
	return ctx;
}
