import type { User } from "@ironveil/shared-types";
import { createContext, type ReactNode, useContext, useState } from "react";
import { login as apiLogin, logout as apiLogout } from "../api/auth.js";
import {
	getMyOrganizations,
	type OrganizationMembership,
} from "../api/organizations.js";

interface AuthState {
	user: User | null;
	organizations: OrganizationMembership[];
	currentOrganizationId: string | null;
	isAuthenticated: boolean;
}

interface AuthContextValue extends Omit<AuthState, "currentOrganizationId"> {
	currentOrganization: OrganizationMembership | null;
	setCurrentOrganization: (organizationId: string) => void;
	login: (username: string, password: string) => Promise<void>;
	logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [state, setState] = useState<AuthState>({
		user: null,
		organizations: [],
		currentOrganizationId: null,
		isAuthenticated: false,
	});

	const login = async (username: string, password: string) => {
		const { user } = await apiLogin(username, password);
		const organizations = await getMyOrganizations();

		setState({
			user,
			organizations,
			currentOrganizationId: organizations[0]?.organizationId ?? null,
			isAuthenticated: true,
		});
	};

	const logout = () => {
		apiLogout();
		setState({
			user: null,
			organizations: [],
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

	const currentOrganization =
		state.organizations.find(
			(o) => o.organizationId === state.currentOrganizationId,
		) ?? null;

	return (
		<AuthContext.Provider
			value={{
				...state,
				currentOrganization,
				setCurrentOrganization,
				login,
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
